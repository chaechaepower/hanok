import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import type { LiveCardData, PageResponse } from '@/types';

const CATEGORY_ID_MAP: Record<number, string> = {
  1: 'SNEAKERS',
  2: 'APPAREL',
  3: 'WATCH',
  4: 'BAG',
  5: 'JEWELRY',
  6: 'CARD',
  7: 'FIGURE',
  8: 'ELECTRONICS',
  9: 'ART',
  10: 'ANTIQUE',
  11: 'ETC',
};

const CATEGORY_CODES = Object.values(CATEGORY_ID_MAP);

const SELLERS = [
  { sellerId: 10, nickname: 'vintage_hub' },
  { sellerId: 11, nickname: 'watch_studio' },
  { sellerId: 12, nickname: 'sneaker_room' },
  { sellerId: 13, nickname: 'gallery_31' },
  { sellerId: 14, nickname: 'card_deck' },
  { sellerId: 15, nickname: 'bag_corner' },
];

const FOLLOWING_SELLER_IDS = new Set<number>([10, 12, 14]);

const MAIN_LIVE_STREAMS: LiveCardData[] = Array.from({ length: 60 }, (_, index) => {
  const id = index + 1;
  const seller = SELLERS[index % SELLERS.length];
  const category = CATEGORY_CODES[index % CATEGORY_CODES.length] ?? 'ETC';

  const isLive = index % 8 !== 0;
  const startedAt = isLive ? new Date(Date.now() - index * 12 * 60 * 1000).toISOString() : null;
  const scheduledAt = isLive ? null : new Date(Date.now() + (index + 1) * 30 * 60 * 1000).toISOString();

  return {
    streamId: id,
    title: `Live auction #${id}`,
    category,
    thumbnailUri: `https://picsum.photos/seed/live-${id}/800/1200`,
    isLive,
    viewerCount: ((id * 53) % 900) + 20,
    scheduledAt,
    startedAt,
    seller: {
      sellerId: seller.sellerId,
      nickname: seller.nickname,
      profileImageUri: `https://picsum.photos/seed/seller-${seller.sellerId}/120/120`,
    },
  };
});

const toNumber = (value: string | null, fallback: number) => {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const mainHandlers = [
  http.get(`${BASE_URL}/v1/streams/:streamId/enter`, ({ params }) => {
    const streamId = Number(params.streamId);
    const stream = MAIN_LIVE_STREAMS.find((item) => item.streamId === streamId) ?? MAIN_LIVE_STREAMS[0];

    return HttpResponse.json({
      streamId: stream?.streamId ?? streamId,
      title: stream?.title ?? '방송 제목',
      category: stream?.category ?? 'ELECTRONICS',
      status: 'LIVE',
      notice: '공지는 어쩌구입니다. 배송은 2일 내로 일괄 배송됩니다.',
      seller: {
        sellerId: stream?.seller.sellerId ?? 1,
        nickname: stream?.seller.nickname ?? '판매자명',
        profileImage: stream?.seller.profileImageUri ?? null,
        grade: 'GENERAL',
      },
      viewerCount: stream?.viewerCount ?? 100,
      topBidders: [
        { rank: 1, nickname: '고미술애호가', amount: 685000 },
        { rank: 2, nickname: '전통수집광', amount: 650000 },
        { rank: 3, nickname: 'Heritage_K', amount: 620000 },
      ],
    });
  }),
  http.get(`${BASE_URL}/v1/streams`, ({ request }) => {
    const url = new URL(request.url);

    const type = (url.searchParams.get('type') ?? 'ALL').toUpperCase();
    const status = (url.searchParams.get('status') ?? 'LIVE').toUpperCase();
    const sort = (url.searchParams.get('sort') ?? 'LATEST').toUpperCase();

    const categoryId = toNumber(url.searchParams.get('categoryId'), NaN);
    const page = Math.max(0, toNumber(url.searchParams.get('page'), 0));
    const size = Math.max(1, toNumber(url.searchParams.get('size'), 8));

    let streams = [...MAIN_LIVE_STREAMS];

    if (type === 'FOLLOWING') {
      streams = streams.filter((stream) => FOLLOWING_SELLER_IDS.has(stream.seller.sellerId));
    }

    if (!Number.isNaN(categoryId)) {
      const categoryCode = CATEGORY_ID_MAP[categoryId];
      if (categoryCode) {
        streams = streams.filter((stream) => stream.category === categoryCode);
      }
    }

    streams =
      status === 'SCHEDULED' ? streams.filter((stream) => !stream.isLive) : streams.filter((stream) => stream.isLive);

    streams.sort((a, b) => {
      if (sort === 'VIEWER_COUNT') {
        return b.viewerCount - a.viewerCount;
      }

      const aDate = Date.parse(a.startedAt ?? a.scheduledAt ?? '') || 0;
      const bDate = Date.parse(b.startedAt ?? b.scheduledAt ?? '') || 0;
      return bDate - aDate;
    });

    const start = page * size;
    const end = start + size;
    const content = streams.slice(start, end);

    const response: PageResponse<LiveCardData> = {
      content,
      page,
      size,
      totalElements: streams.length,
      hasNext: end < streams.length,
    };

    return HttpResponse.json(response);
  }),
];
