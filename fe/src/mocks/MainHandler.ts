import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import type { LiveCardData, PageResponse, SearchMatchReason, SearchStreamResult } from '@/types';

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

type SearchMockEntry = SearchStreamResult & {
  itemNames: string[];
  tags: string[];
};

const SEARCH_STREAMS: SearchMockEntry[] = [
  {
    streamId: 1,
    title: '나이키 한정판 경매 방송',
    thumbnail: '',
    category: 'SNEAKERS',
    status: 'LIVE',
    viewerCount: 142,
    scheduledAt: null,
    seller: {
      sellerId: 10,
      nickname: '판매왕',
      profileImageUri: '',
    },
    itemNames: ['나이키 덩크 로우', '오프화이트 티셔츠'],
    tags: ['#나이키', '#한정판', '#스니커즈'],
    matchReasons: [],
  },
  {
    streamId: 7,
    title: '오늘의 패션 경매',
    thumbnail: null,
    category: 'APPAREL',
    status: 'ENDED',
    viewerCount: 87,
    scheduledAt: null,
    seller: {
      sellerId: 11,
      nickname: '패션딜러',
      profileImageUri: null,
    },
    itemNames: ['에어포스 1', '빈티지 데님 자켓'],
    tags: ['#나이키', '#패션', '#빈티지'],
    matchReasons: [],
  },
  {
    streamId: 12,
    title: '롤렉스 빈티지 컬렉션 라이브',
    thumbnail: '',
    category: 'WATCH',
    status: 'LIVE',
    viewerCount: 56,
    scheduledAt: null,
    seller: {
      sellerId: 12,
      nickname: '워치스튜디오',
      profileImageUri: '',
    },
    itemNames: ['롤렉스 데이저스트', '오메가 씨마스터'],
    tags: ['#시계', '#롤렉스', '#빈티지'],
    matchReasons: [],
  },
  {
    streamId: 18,
    title: '카드 수집가 야간 경매',
    thumbnail: null,
    category: 'CARD',
    status: 'PAUSED',
    viewerCount: 33,
    scheduledAt: null,
    seller: {
      sellerId: 14,
      nickname: '카드수집러',
      profileImageUri: null,
    },
    itemNames: ['포켓몬 카드 리자몽', '원피스 카드 부스터'],
    tags: ['#트레이딩카드', '#포켓몬', '#원피스'],
    matchReasons: [],
  },
  {
    streamId: 24,
    title: '명품 가방 셀렉션',
    thumbnail: '',
    category: 'BAG',
    status: 'SCHEDULED',
    viewerCount: 0,
    scheduledAt: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    seller: {
      sellerId: 15,
      nickname: '럭셔리셀러',
      profileImageUri: '',
    },
    itemNames: ['샤넬 클래식 플랩백', '프라다 리에디션'],
    tags: ['#명품', '#가방', '#샤넬'],
    matchReasons: [],
  },
  {
    streamId: 31,
    title: '피규어 오픈박스 라이브',
    thumbnail: null,
    category: 'FIGURE',
    status: 'LIVE',
    viewerCount: 219,
    scheduledAt: null,
    seller: {
      sellerId: 13,
      nickname: '피규어존',
      profileImageUri: null,
    },
    itemNames: ['드래곤볼 손오공 피규어', '원피스 조로 피규어'],
    tags: ['#피규어', '#애니', '#한정판'],
    matchReasons: [],
  },
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

const buildSearchMatchReasons = (entry: SearchMockEntry, keyword: string) => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const reasons: SearchMatchReason[] = [];

  if (!normalizedKeyword) {
    return reasons;
  }

  if (entry.title.toLowerCase().includes(normalizedKeyword)) {
    reasons.push({
      type: 'STREAM_TITLE',
      matchedValue: entry.title,
    });
  }

  entry.itemNames.forEach((itemName) => {
    if (itemName.toLowerCase().includes(normalizedKeyword)) {
      reasons.push({
        type: 'ITEM_NAME',
        matchedValue: itemName,
      });
    }
  });

  entry.tags.forEach((tag) => {
    if (tag.toLowerCase().includes(normalizedKeyword)) {
      reasons.push({
        type: 'TAG',
        matchedValue: tag,
      });
    }
  });

  return reasons;
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

  http.get(`${BASE_URL}/v1/search`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.trim() ?? '';

    if (keyword.length < 2 || keyword.length > 50) {
      return HttpResponse.json([], { status: 200 });
    }

    const response: SearchStreamResult[] = SEARCH_STREAMS.map((entry) => ({
      ...entry,
      matchReasons: buildSearchMatchReasons(entry, keyword),
    })).filter((entry) => entry.matchReasons.length > 0);

    return HttpResponse.json(response);
  }),
];
