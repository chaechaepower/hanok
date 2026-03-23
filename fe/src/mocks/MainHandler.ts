import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import { MAIN_CATEGORY_IDS } from '@/constants/category';
import type {
  LiveCardData,
  NewSellerRecommendedStream,
  NewSellerRecommendedStreamsResponse,
  PageResponse,
  SearchMatchReason,
  SearchStreamResult,
  SearchStreamStatus,
} from '@/types';

import { getRegisteredLiveById, getRegisteredLiveCards } from './LiveCreateHandler';
import { getCurrentMockUser, isSellerFollowed } from './mockState';

const SELLERS = [
  { sellerId: 10, nickname: 'vintage_hub' },
  { sellerId: 11, nickname: 'watch_studio' },
  { sellerId: 12, nickname: 'sneaker_room' },
  { sellerId: 13, nickname: 'gallery_31' },
  { sellerId: 14, nickname: 'card_deck' },
  { sellerId: 15, nickname: 'bag_corner' },
];

const NEW_SELLER_IDS = new Set([10, 11, 12]);

const isActiveStreamStatus = (streamStatus: SearchStreamStatus) => streamStatus === 'LIVE' || streamStatus === 'PAUSED';

type SearchMockEntry = SearchStreamResult & {
  itemNames: string[];
  tags: string[];
};

const SEARCH_STREAMS: SearchMockEntry[] = [
  {
    streamId: 1,
    title: '나이키 한정판 경매 방송',
    thumbnail: '',
    category: 'SNEAKERS_SHOES',
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
    category: 'CLOTHING',
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
    category: 'WATCHES',
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
    category: 'TRADING_CARDS',
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
    category: 'BAGS_FASHION_ACCESSORIES',
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
    category: 'FIGURES_ARTTOYS_GOODS',
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
  const category = MAIN_CATEGORY_IDS[index % MAIN_CATEGORY_IDS.length];
  const streamStatus: SearchStreamStatus =
    index % 8 === 0 ? 'SCHEDULED' : index % 11 === 0 ? 'PAUSED' : index % 15 === 0 ? 'ENDED' : 'LIVE';
  const hasStarted = streamStatus !== 'SCHEDULED';
  const startedAt = hasStarted ? new Date(Date.now() - index * 12 * 60 * 1000).toISOString() : null;
  const scheduledAt =
    streamStatus === 'SCHEDULED' ? new Date(Date.now() + (index + 1) * 30 * 60 * 1000).toISOString() : null;

  return {
    streamId: id,
    title: `Live auction #${id}`,
    category,
    thumbnailUri: null,
    streamStatus,
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

const toNewSellerRecommendedStream = (stream: LiveCardData): NewSellerRecommendedStream => ({
  streamId: stream.streamId,
  title: stream.title,
  category: stream.category,
  thumbnailUri: stream.thumbnailUri,
  isLive: stream.streamStatus === 'LIVE',
  viewerCount: stream.viewerCount,
  scheduledAt: stream.scheduledAt,
  startedAt: stream.startedAt,
  seller: stream.seller,
});

export const mainHandlers = [
  http.get(`${BASE_URL}/v1/streams/:streamId/enter`, ({ params }) => {
    const streamId = Number(params.streamId);
    const currentUser = getCurrentMockUser();
    const registeredLive = getRegisteredLiveById(streamId);

    if (registeredLive) {
      const sellerId = registeredLive.sellerId;
      const isHost = sellerId === (currentUser?.userId ?? null);

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
        token: `mock-stream-token-${registeredLive.streamId}`,
        identity: `user-${currentUser?.userId ?? 0}`,
        isFollowing: isSellerFollowed(sellerId),
        isHost,
      });
    }

    const stream = MAIN_LIVE_STREAMS.find((item) => item.streamId === streamId) ?? MAIN_LIVE_STREAMS[0];
    const sellerId = stream?.seller.sellerId ?? 1;
    const isHost = sellerId === (currentUser?.userId ?? null);

    return HttpResponse.json({
      streamId: stream?.streamId ?? streamId,
      title: stream?.title ?? 'Broadcast title',
      category: stream?.category ?? 'ELECTRONICS',
      thumbnail: stream?.thumbnailUri ?? null,
      scheduledAt: stream?.scheduledAt ?? null,
      startType: stream?.streamStatus === 'SCHEDULED' ? 'SCHEDULED' : 'IMMEDIATE',
      status: stream?.streamStatus ?? 'LIVE',
      notice: 'Welcome to the live auction.',
      isLive: stream ? isActiveStreamStatus(stream.streamStatus) : true,
      createdAt: stream?.startedAt ?? new Date().toISOString(),
      items: [],
      seller: {
        sellerId,
        nickname: stream?.seller.nickname ?? 'seller',
        profileImage: stream?.seller.profileImageUri ?? null,
      },
      viewerCount: stream?.viewerCount ?? 100,
      token: `mock-stream-token-${stream?.streamId ?? streamId}`,
      identity: `user-${currentUser?.userId ?? 0}`,
      isFollowing: isSellerFollowed(sellerId),
      isHost,
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
    let streams = [
      ...registeredLiveCards,
      ...MAIN_LIVE_STREAMS.filter((stream) => !registeredIds.has(stream.streamId)),
    ];

    if (type === 'FOLLOWING') {
      streams = streams.filter((stream) => isSellerFollowed(stream.seller.sellerId));
    }

    if (category) {
      streams = streams.filter((stream) => stream.category === category);
    }

    streams =
      status === 'SCHEDULED'
        ? streams.filter((stream) => stream.streamStatus === 'SCHEDULED')
        : streams.filter((stream) => isActiveStreamStatus(stream.streamStatus));

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

  http.get(`${BASE_URL}/v1/streams/recommend/new-seller`, ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(0, toNumber(url.searchParams.get('page'), 0));
    const size = Math.max(1, toNumber(url.searchParams.get('size'), 20));

    const registeredLiveCards = getRegisteredLiveCards();
    const registeredIds = new Set(registeredLiveCards.map((stream) => stream.streamId));
    const streams = [
      ...registeredLiveCards,
      ...MAIN_LIVE_STREAMS.filter((stream) => !registeredIds.has(stream.streamId)),
    ]
      .filter((stream) => NEW_SELLER_IDS.has(stream.seller.sellerId))
      .filter((stream) => stream.streamStatus === 'LIVE' || stream.streamStatus === 'SCHEDULED')
      .sort((a, b) => {
        const aDate = Date.parse(a.startedAt ?? a.scheduledAt ?? '') || 0;
        const bDate = Date.parse(b.startedAt ?? b.scheduledAt ?? '') || 0;
        return bDate - aDate;
      });

    const totalElements = streams.length;
    const start = page * size;
    const end = start + size;

    const response: NewSellerRecommendedStreamsResponse = {
      content: streams.slice(start, end).map(toNewSellerRecommendedStream),
      page,
      size,
      totalElements,
      hasNext: end < totalElements,
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
