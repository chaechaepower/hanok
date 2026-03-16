import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import type { LiveCardData, PageResponse } from '@/types';

import { getRegisteredLiveById, getRegisteredLiveCards } from './LiveCreateHandler';
import { getCurrentMockUser, isSellerFollowed } from './mockState';

const CATEGORY_CODES = [
  'SNEAKERS_SHOES',
  'CLOTHING',
  'WATCHES',
  'BAGS_FASHION_ACCESSORIES',
  'JEWELRY',
  'TRADING_CARDS',
  'FIGURES_PLASTIC_MODELS',
  'ELECTRONICS',
  'ART',
  'ANTIQUES_VINTAGE',
  'ETC',
];

const SELLERS = [
  { sellerId: 10, nickname: 'vintage_hub' },
  { sellerId: 11, nickname: 'watch_studio' },
  { sellerId: 12, nickname: 'sneaker_room' },
  { sellerId: 13, nickname: 'gallery_31' },
  { sellerId: 14, nickname: 'card_deck' },
  { sellerId: 15, nickname: 'bag_corner' },
];

const MAIN_LIVE_STREAMS: LiveCardData[] = Array.from({ length: 60 }, (_, index) => {
  const id = index + 1;
  const seller = SELLERS[index % SELLERS.length];
  const category = CATEGORY_CODES[index % CATEGORY_CODES.length];
  const isLive = index % 8 !== 0;
  const startedAt = isLive ? new Date(Date.now() - index * 12 * 60 * 1000).toISOString() : null;
  const scheduledAt = isLive ? null : new Date(Date.now() + (index + 1) * 30 * 60 * 1000).toISOString();

  return {
    streamId: id,
    title: `Live auction #${id}`,
    category,
    thumbnailUri: null,
    isLive,
    viewerCount: ((id * 53) % 900) + 20,
    scheduledAt,
    startedAt,
    seller: {
      sellerId: seller.sellerId,
      nickname: seller.nickname,
      profileImageUri: null,
    },
  };
});

const toNumber = (value: string | null, fallback: number) => {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const mainHandlers = [
  http.get(`${BASE_URL}/v1/streams/:streamId/enter`, ({ params }) => {
    const streamId = Number(params.streamId);
    const currentUser = getCurrentMockUser();
    const registeredLive = getRegisteredLiveById(streamId);

    if (registeredLive) {
      const sellerId = registeredLive.sellerId;

      return HttpResponse.json({
        streamId: registeredLive.streamId,
        title: registeredLive.title,
        category: registeredLive.category,
        thumbnail: registeredLive.thumbnail,
        scheduledAt: registeredLive.scheduledAt,
        startType: registeredLive.startType,
        status: registeredLive.isLive ? 'LIVE' : 'SCHEDULED',
        notice: registeredLive.notice ?? null,
        isLive: registeredLive.isLive,
        createdAt: registeredLive.createdAt,
        items: registeredLive.items,
        seller: {
          sellerId,
          nickname: registeredLive.sellerNickname,
          profileImage: registeredLive.sellerProfileImage,
        },
        viewerCount: 0,
        topBidders: [],
        token: `mock-stream-token-${registeredLive.streamId}`,
        identity: `user-${currentUser?.userId ?? 0}`,
        isFollowing: isSellerFollowed(sellerId),
      });
    }

    const stream = MAIN_LIVE_STREAMS.find((item) => item.streamId === streamId) ?? MAIN_LIVE_STREAMS[0];
    const sellerId = stream?.seller.sellerId ?? 1;

    return HttpResponse.json({
      streamId: stream?.streamId ?? streamId,
      title: stream?.title ?? 'Broadcast title',
      category: stream?.category ?? 'ELECTRONICS',
      thumbnail: stream?.thumbnailUri ?? null,
      scheduledAt: stream?.scheduledAt ?? null,
      startType: stream?.isLive ? 'IMMEDIATE' : 'SCHEDULED',
      status: stream?.isLive ? 'LIVE' : 'SCHEDULED',
      notice: 'Welcome to the live auction.',
      isLive: stream?.isLive ?? true,
      createdAt: stream?.startedAt ?? new Date().toISOString(),
      items: [],
      seller: {
        sellerId,
        nickname: stream?.seller.nickname ?? 'seller',
        profileImage: stream?.seller.profileImageUri ?? null,
      },
      viewerCount: stream?.viewerCount ?? 100,
      topBidders: [
        { rank: 1, nickname: 'top_bidder_1', amount: 685000 },
        { rank: 2, nickname: 'top_bidder_2', amount: 650000 },
        { rank: 3, nickname: 'top_bidder_3', amount: 620000 },
      ],
      token: `mock-stream-token-${stream?.streamId ?? streamId}`,
      identity: `user-${currentUser?.userId ?? 0}`,
      isFollowing: isSellerFollowed(sellerId),
    });
  }),

  http.get(`${BASE_URL}/v1/streams`, ({ request }) => {
    const url = new URL(request.url);
    const type = (url.searchParams.get('type') ?? 'ALL').toUpperCase();
    const status = (url.searchParams.get('status') ?? 'LIVE').toUpperCase();
    const sort = (url.searchParams.get('sort') ?? 'LATEST').toUpperCase();
    const category = url.searchParams.get('category');
    const page = Math.max(0, toNumber(url.searchParams.get('page'), 0));
    const size = Math.max(1, toNumber(url.searchParams.get('size'), 8));

    const registeredLiveCards = getRegisteredLiveCards();
    const registeredIds = new Set(registeredLiveCards.map((stream) => stream.streamId));
    let streams = [...registeredLiveCards, ...MAIN_LIVE_STREAMS.filter((stream) => !registeredIds.has(stream.streamId))];

    if (type === 'FOLLOWING') {
      streams = streams.filter((stream) => isSellerFollowed(stream.seller.sellerId));
    }

    if (category) {
      streams = streams.filter((stream) => stream.category === category);
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

    const totalElements = streams.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = streams.slice(start, end);

    const response: PageResponse<LiveCardData> = {
      totalElements,
      totalPages,
      pageable: {
        pageNumber: page,
        paged: true,
        pageSize: size,
        unpaged: false,
        offset: start,
        sort: { sorted: sort !== 'LATEST', unsorted: sort === 'LATEST', empty: false },
      },
      numberOfElements: content.length,
      size,
      content,
      number: page,
      sort: { sorted: sort !== 'LATEST', unsorted: sort === 'LATEST', empty: false },
      first: page === 0,
      last: end >= totalElements,
      empty: content.length === 0,
    };

    return HttpResponse.json(response);
  }),
];
