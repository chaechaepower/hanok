import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import Usagi from '@/assets/Usagi.webp';

import type {
  DeleteStreamResponse,
  EndStreamResponse,
  ItemSyncPayload,
  ItemSyncAuctionStatus,
  LiveCardData,
  LiveStreamItemStatus,
  StreamRequest,
  StreamDetailResponse,
  StreamDetailItem,
  StreamEnterItem,
  UpdateStreamResponse,
} from '@/types';

import { getMockItemById } from './ItemHandler';
import { getCurrentMockUser, mockLoginUsers } from './mockState';

type RegisteredLiveItem =
  | (Omit<Extract<StreamDetailItem, { auctionType: 'BOTTOM_UP' }>, 'tags' | 'images'> & {
      description?: string;
      tags?: string[];
      images?: string[];
      image1: string | null;
    })
  | (Omit<Extract<StreamDetailItem, { auctionType: 'UNIQUE_TOP' }>, 'tags' | 'images'> & {
      description?: string;
      tags?: string[];
      images?: string[];
      image1: string | null;
    });

type RegisteredLive = Omit<StreamDetailResponse, 'items'> & {
  items: RegisteredLiveItem[];
  sellerId: number;
  sellerNickname: string;
  sellerProfileImage: string | null;
  streamStatus?: 'LIVE' | 'PAUSED' | 'SCHEDULED';
};

type CreateStreamItemInput = StreamRequest['auctionItems'][number] | number;

const normalizeAuctionItem = (
  auctionItem: CreateStreamItemInput,
  index: number,
): StreamRequest['auctionItems'][number] => {
  if (typeof auctionItem === 'number') {
    return {
      itemId: auctionItem,
      auctionType: 'BOTTOM_UP',
      auctionDuration: 60,
      bottomUp: {
        startPrice: 10000 * (index + 1),
        bidUnit: 1000,
      },
      uniqueTop: null,
    };
  }

  if (auctionItem.auctionType === 'UNIQUE_TOP') {
    const minPrice = auctionItem.uniqueTop?.minPrice ?? 10000;
    const maxPrice = auctionItem.uniqueTop?.maxPrice ?? minPrice;

    return {
      itemId: auctionItem.itemId,
      auctionType: 'UNIQUE_TOP',
      auctionDuration: auctionItem.auctionDuration,
      bottomUp: null,
      uniqueTop: {
        minPrice,
        maxPrice,
      },
    };
  }

  const startPrice = auctionItem.bottomUp?.startPrice ?? 10000;
  const bidUnit = auctionItem.bottomUp?.bidUnit ?? 1000;

  return {
    itemId: auctionItem.itemId,
    auctionType: 'BOTTOM_UP',
    auctionDuration: auctionItem.auctionDuration,
    bottomUp: {
      startPrice,
      bidUnit,
    },
    uniqueTop: null,
  };
};

const createStreamItems = (
  auctionItems: CreateStreamItemInput[],
  category: string,
  thumbnail: string | null,
): RegisteredLiveItem[] =>
  auctionItems.map((rawAuctionItem, index) => {
    const auctionItem = normalizeAuctionItem(rawAuctionItem, index);
    const mockItem = getMockItemById(auctionItem.itemId);

    if (auctionItem.auctionType === 'BOTTOM_UP') {
      return {
        itemId: auctionItem.itemId,
        name: mockItem?.name ?? `Mock item ${auctionItem.itemId}`,
        description: mockItem?.description ?? '',
        tags: mockItem?.tags ?? [],
        images: mockItem?.images ?? (thumbnail ? [thumbnail] : []),
        category: mockItem?.category ?? category,
        status: 'READY',
        auctionType: 'BOTTOM_UP',
        itemCondition: mockItem?.itemCondition ?? 'BRAND_NEW',
        image1: mockItem?.images[0] ?? thumbnail,
        createdAt: mockItem?.createdAt ?? new Date(Date.now() - index * 60000).toISOString(),
        auctionDuration: auctionItem.auctionDuration,
        bottomUp: {
          startPrice: auctionItem.bottomUp.startPrice,
          bidUnit: auctionItem.bottomUp.bidUnit,
        },
        uniqueTop: null,
      };
    }

    return {
      itemId: auctionItem.itemId,
      name: mockItem?.name ?? `Mock item ${auctionItem.itemId}`,
      description: mockItem?.description ?? '',
      tags: mockItem?.tags ?? [],
      images: mockItem?.images ?? (thumbnail ? [thumbnail] : []),
      category: mockItem?.category ?? category,
      status: 'READY',
      auctionType: 'UNIQUE_TOP',
      itemCondition: mockItem?.itemCondition ?? 'BRAND_NEW',
      image1: mockItem?.images[0] ?? thumbnail,
      createdAt: mockItem?.createdAt ?? new Date(Date.now() - index * 60000).toISOString(),
      auctionDuration: auctionItem.auctionDuration,
      bottomUp: null,
      uniqueTop: {
        minPrice: auctionItem.uniqueTop.minPrice,
        maxPrice: auctionItem.uniqueTop.maxPrice,
      },
    };
  });

const defaultSeedSeller = mockLoginUsers.find((user) => user.userId === 2);

const defaultSeedSellerSnapshot = {
  sellerId: defaultSeedSeller?.userId ?? 2,
  sellerNickname: defaultSeedSeller?.nickname ?? 'seller',
  sellerProfileImage: defaultSeedSeller?.profileImage ?? null,
};

const getCurrentSellerId = () => getCurrentMockUser()?.userId ?? defaultSeedSellerSnapshot.sellerId;

const getCurrentSellerSnapshot = () => {
  const currentUser = getCurrentMockUser();

  return {
    sellerId: currentUser?.userId ?? 2,
    sellerNickname: currentUser?.nickname ?? 'seller',
    sellerProfileImage: currentUser?.profileImage ?? null,
  };
};

export const getRegisteredLiveById = (streamId: number) => registeredLives.find((item) => item.streamId === streamId);

const getRegisteredLiveState = (live: RegisteredLive) => live.streamStatus ?? (live.isLive ? 'LIVE' : 'SCHEDULED');
const isRegisteredLiveActive = (live: RegisteredLive) => {
  const state = getRegisteredLiveState(live);
  return state === 'LIVE' || state === 'PAUSED';
};

const toStreamDetailStatus = (live: RegisteredLive, item: RegisteredLiveItem): StreamDetailItem['status'] =>
  !live.isLive && item.status === 'READY' ? 'SCHEDULED' : item.status;

const toStreamEnterStatus = (status: RegisteredLiveItem['status']): LiveStreamItemStatus => {
  switch (status) {
    case 'INTRODUCING':
    case 'LIVE':
    case 'SOLD':
    case 'UNSOLD':
      return status;
    case 'READY':
    case 'SCHEDULED':
    case 'PENDING':
    default:
      return 'READY';
  }
};

const toItemSyncStatus = (status: RegisteredLiveItem['status']): ItemSyncAuctionStatus => {
  switch (status) {
    case 'INTRODUCING':
    case 'LIVE':
    case 'SOLD':
    case 'UNSOLD':
      return status;
    case 'READY':
    case 'SCHEDULED':
    case 'PENDING':
    default:
      return 'READY';
  }
};

const toStreamDetailItem = (live: RegisteredLive, item: RegisteredLiveItem): StreamDetailItem =>
  item.auctionType === 'UNIQUE_TOP'
    ? {
        itemId: item.itemId,
        name: item.name,
        description: item.description ?? '',
        tags: item.tags ?? getMockItemById(item.itemId)?.tags ?? [],
        images: item.images ?? (item.image1 ? [item.image1] : []),
        auctionType: 'UNIQUE_TOP',
        auctionDuration: item.auctionDuration,
        bottomUp: null,
        uniqueTop: item.uniqueTop,
        itemCondition: item.itemCondition,
        category: item.category,
        status: toStreamDetailStatus(live, item),
        createdAt: item.createdAt,
      }
    : {
        itemId: item.itemId,
        name: item.name,
        description: item.description ?? '',
        tags: item.tags ?? getMockItemById(item.itemId)?.tags ?? [],
        images: item.images ?? (item.image1 ? [item.image1] : []),
        auctionType: 'BOTTOM_UP',
        auctionDuration: item.auctionDuration,
        bottomUp: item.bottomUp,
        uniqueTop: null,
        itemCondition: item.itemCondition,
        category: item.category,
        status: toStreamDetailStatus(live, item),
        createdAt: item.createdAt,
      };

export const toStreamEnterItem = (item: RegisteredLiveItem): StreamEnterItem =>
  item.auctionType === 'UNIQUE_TOP'
    ? {
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        startPrice: item.uniqueTop.minPrice,
        minPrice: item.uniqueTop.minPrice,
        maxPrice: item.uniqueTop.maxPrice,
        status: toStreamEnterStatus(item.status),
        auctionType: 'UNIQUE_TOP',
        itemCondition: item.itemCondition,
        image1: item.image1,
        createdAt: item.createdAt,
        description: item.description ?? '',
        auctionTime: item.auctionDuration,
        images: item.images ?? (item.image1 ? [item.image1] : []),
      }
    : {
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        startPrice: item.bottomUp.startPrice,
        status: toStreamEnterStatus(item.status),
        auctionType: 'BOTTOM_UP',
        itemCondition: item.itemCondition,
        image1: item.image1,
        createdAt: item.createdAt,
        description: item.description ?? '',
        bidUnit: item.bottomUp.bidUnit,
        auctionTime: item.auctionDuration,
        images: item.images ?? (item.image1 ? [item.image1] : []),
      };

const resolveRegisteredLiveItemImages = (item: RegisteredLiveItem, thumbnail: string | null): string[] => {
  if (item.images && item.images.length > 0) {
    return item.images;
  }

  if (item.image1) {
    return [item.image1];
  }

  if (thumbnail) {
    return [thumbnail];
  }

  return [];
};

const toItemSyncItem = (item: RegisteredLiveItem, thumbnail: string | null): ItemSyncPayload['items'][number] => {
  const images = resolveRegisteredLiveItemImages(item, thumbnail);

  if (item.auctionType === 'UNIQUE_TOP') {
    return {
      auctionId: item.itemId,
      itemName: item.name,
      description: item.description ?? '',
      images,
      auctionType: 'UNIQUE_TOP',
      auctionStatus: toItemSyncStatus(item.status),
      auctionTime: item.auctionDuration,
      itemCondition: item.itemCondition,
      finalPrice: item.status === 'SOLD' ? Math.round(item.uniqueTop.minPrice * 1.5) : null,
      bidUnit: null,
      startPrice: null,
      minPrice: item.uniqueTop.minPrice,
      maxPrice: item.uniqueTop.maxPrice,
    };
  }

  return {
    auctionId: item.itemId,
    itemName: item.name,
    description: item.description ?? '',
    images,
    auctionType: 'BOTTOM_UP',
    auctionStatus: toItemSyncStatus(item.status),
    auctionTime: item.auctionDuration,
    itemCondition: item.itemCondition,
    finalPrice: item.status === 'SOLD' ? Math.round(item.bottomUp.startPrice * 1.5) : null,
    bidUnit: item.bottomUp.bidUnit,
    startPrice: item.bottomUp.startPrice,
    minPrice: null,
    maxPrice: null,
  };
};

export const getInitialItemSyncPayloadForStream = (streamId: number): ItemSyncPayload | null => {
  const live = getRegisteredLiveById(streamId);

  if (!live) {
    return null;
  }

  return {
    items: live.items.map((item) => toItemSyncItem(item, live.thumbnail)),
  };
};

export const getRegisteredLiveCards = (): LiveCardData[] =>
  registeredLives.map((live) => ({
    streamId: live.streamId,
    title: live.title,
    category: live.category,
    thumbnailUri: live.thumbnail,
    streamStatus: getRegisteredLiveState(live),
    viewerCount: 0,
    scheduledAt: isRegisteredLiveActive(live) ? null : live.scheduledAt,
    startedAt: isRegisteredLiveActive(live) ? live.createdAt : null,
    seller: {
      sellerId: live.sellerId,
      nickname: live.sellerNickname,
      profileImageUri: live.sellerProfileImage,
    },
  }));

const registeredLives: RegisteredLive[] = [
  {
    streamId: 1,
    title: 'Luxury bag showcase',
    category: 'BAGS_FASHION_ACCESSORIES',
    thumbnail: Usagi,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    startType: 'SCHEDULED',
    notice: 'Limited quantity lots open first.',
    isLive: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      {
        itemId: 101,
        name: '고려청자 상감운학문 매병',
        category: 'BAGS_FASHION_ACCESSORIES',
        status: 'READY',
        itemCondition: 'BRAND_NEW',
        image1: Usagi,
        createdAt: new Date(Date.now() - 0 * 60000).toISOString(),
        tags: [],
        description:
          '고려시대 12세기 상감청자 매병으로, 운학문(구름과 학) 무늬가 정교하게 시문되어 있습니다. 보존 상태가 매우 우수합니다.',
        auctionType: 'UNIQUE_TOP',
        auctionDuration: 30,
        bottomUp: null,
        uniqueTop: {
          minPrice: 250000,
          maxPrice: 1240000,
        },
        images: [
          'https://picsum.photos/seed/101a/400/400',
          'https://picsum.photos/seed/101b/400/400',
          'https://picsum.photos/seed/101c/400/400',
        ],
      },
      {
        itemId: 102,
        name: '청자 투각 칠보문 향로',
        category: 'BAGS_FASHION_ACCESSORIES',
        status: 'SOLD',
        itemCondition: 'OPEN_BOX',
        image1: Usagi,
        createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
        description:
          '칠보문 투각 기법이 적용된 고려청자 향로입니다. 뚜껑의 투각 세공이 정밀하며, 향 연기가 문양 사이로 퍼지는 구조입니다.',
        auctionDuration: 30,
        bottomUp: null,
        uniqueTop: {
          minPrice: 130000,
          maxPrice: 780000,
        },
        auctionType: 'UNIQUE_TOP',
        images: [
          'https://picsum.photos/seed/102a/400/400',
          'https://picsum.photos/seed/102b/400/400',
          'https://picsum.photos/seed/102c/400/400',
        ],
      },
      {
        itemId: 103,
        name: '백자 달항아리',
        category: 'BAGS_FASHION_ACCESSORIES',
        status: 'SOLD',
        itemCondition: 'REFURBISHED',
        image1: Usagi,
        createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
        description: '조선 후기 백자 달항아리로 둥근 형태가 특징입니다. 유약의 자연스러운 흐름이 잘 보존되어 있습니다.',
        auctionDuration: 60,
        bottomUp: null,
        uniqueTop: {
          minPrice: 180000,
          maxPrice: 860000,
        },
        auctionType: 'UNIQUE_TOP',
        images: [
          'https://picsum.photos/seed/103a/400/400',
          'https://picsum.photos/seed/103b/400/400',
          'https://picsum.photos/seed/103c/400/400',
        ],
      },
      {
        itemId: 104,
        name: '분청사기 철화 어문 장군',
        category: 'BAGS_FASHION_ACCESSORIES',
        status: 'SOLD',
        itemCondition: 'USED',
        image1: Usagi,
        createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
        description:
          '분청사기에 철화 기법으로 물고기 문양을 그린 장군(대형 항아리)입니다. 소박하면서도 힘찬 붓놀림이 특징입니다.',
        auctionDuration: 30,
        bottomUp: null,
        uniqueTop: {
          minPrice: 95000,
          maxPrice: 520000,
        },
        auctionType: 'UNIQUE_TOP',
        images: [
          'https://picsum.photos/seed/104a/400/400',
          'https://picsum.photos/seed/104b/400/400',
          'https://picsum.photos/seed/104c/400/400',
        ],
      },
      {
        itemId: 105,
        name: '나전칠기 보석함',
        category: 'BAGS_FASHION_ACCESSORIES',
        status: 'SOLD',
        itemCondition: 'BRAND_NEW',
        image1: Usagi,
        createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        description:
          '전통 나전칠기 기법으로 제작된 보석함입니다. 자개 조각이 정밀하게 배치되어 화려한 광택을 자랑합니다.',
        auctionDuration: 60,
        bottomUp: null,
        uniqueTop: {
          minPrice: 320000,
          maxPrice: 1320000,
        },
        auctionType: 'UNIQUE_TOP',
        images: [
          'https://picsum.photos/seed/105a/400/400',
          'https://picsum.photos/seed/105b/400/400',
          'https://picsum.photos/seed/105c/400/400',
        ],
      },
      {
        itemId: 106,
        name: '조선백자 청화 용문 항아리',
        category: 'BAGS_FASHION_ACCESSORIES',
        status: 'SOLD',
        itemCondition: 'OPEN_BOX',
        image1: Usagi,
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        description:
          '조선시대 청화백자로 용 문양이 힘차게 그려져 있습니다. 코발트 안료의 발색이 선명하게 남아 있습니다.',
        auctionDuration: 30,
        bottomUp: null,
        uniqueTop: {
          minPrice: 200000,
          maxPrice: 980000,
        },
        auctionType: 'UNIQUE_TOP',
        images: [
          'https://picsum.photos/seed/106a/400/400',
          'https://picsum.photos/seed/106b/400/400',
          'https://picsum.photos/seed/106c/400/400',
        ],
      },
      {
        itemId: 107,
        name: '금동 미륵보살 반가사유상',
        category: 'BAGS_FASHION_ACCESSORIES',
        status: 'UNSOLD',
        itemCondition: 'USED',
        image1: Usagi,
        createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
        description: '삼국시대 금동 반가사유상 재현품입니다. 온화한 미소와 섬세한 손가락 표현이 돋보이는 작품입니다.',
        auctionDuration: 60,
        bottomUp: null,
        uniqueTop: {
          minPrice: 500000,
          maxPrice: 2150000,
        },
        auctionType: 'UNIQUE_TOP',
        images: [
          'https://picsum.photos/seed/107a/400/400',
          'https://picsum.photos/seed/107b/400/400',
          'https://picsum.photos/seed/107c/400/400',
        ],
      },
    ],
    ...defaultSeedSellerSnapshot,
  },
  {
    streamId: 2,
    title: 'Sneaker drop live',
    category: 'SNEAKERS_SHOES',
    thumbnail: Usagi,
    scheduledAt: null,
    startType: 'INSTANT',
    notice: 'Top three pairs start first.',
    isLive: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    items: createStreamItems([201, 202], 'SNEAKERS_SHOES', Usagi),
    sellerId: 12,
    sellerNickname: 'sneaker_room',
    sellerProfileImage: 'https://picsum.photos/seed/seller-12/120/120',
  },
  {
    streamId: 3,
    title: 'Sneaker live auction',
    category: 'SNEAKERS_SHOES',
    thumbnail: Usagi,
    scheduledAt: null,
    startType: 'INSTANT',
    notice: '한정판 스니커즈 라이브 경매 진행중!',
    isLive: true,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    items: createStreamItems([301, 302], 'SNEAKERS_SHOES', Usagi),
    ...defaultSeedSellerSnapshot,
  },
  {
    streamId: 4,
    title: 'Watch archive session',
    category: 'WATCHES',
    thumbnail: Usagi,
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    startType: 'SCHEDULED',
    notice: 'Vintage lots only.',
    isLive: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    items: createStreamItems([301], 'WATCHES', Usagi),
    ...defaultSeedSellerSnapshot,
  },
  {
    streamId: 5,
    title: 'Unique top test live',
    category: 'SNEAKERS_SHOES',
    thumbnail: Usagi,
    scheduledAt: null,
    startType: 'INSTANT',
    notice: 'Unique auction buyer test room.',
    isLive: true,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    items: [
      {
        itemId: 501,
        name: 'Unique test sneakers',
        category: 'SNEAKERS_SHOES',
        status: 'LIVE',
        auctionType: 'UNIQUE_TOP',
        itemCondition: 'BRAND_NEW',
        image1: Usagi,
        createdAt: new Date(Date.now() - 900000).toISOString(),
        description: 'Buyer-side unique auction test item.',
        auctionDuration: 10,
        bottomUp: null,
        uniqueTop: {
          minPrice: 1000,
          maxPrice: 10000,
        },
        images: [
          'https://picsum.photos/seed/unique-test-1/400/400',
          'https://picsum.photos/seed/unique-test-2/400/400',
        ],
      },
    ],
    sellerId: 12,
    sellerNickname: 'sneaker_room',
    sellerProfileImage: 'https://picsum.photos/seed/seller-12/120/120',
  },
  {
    streamId: 6,
    title: 'Buyer quick bid test',
    category: 'SNEAKERS_SHOES',
    thumbnail: Usagi,
    scheduledAt: null,
    startType: 'INSTANT',
    notice: 'Buyer-side bottom-up auction test room.',
    isLive: true,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    items: [
      {
        itemId: 601,
        name: 'Buyer test sneakers',
        category: 'SNEAKERS_SHOES',
        status: 'LIVE',
        auctionType: 'BOTTOM_UP',
        itemCondition: 'BRAND_NEW',
        image1: Usagi,
        createdAt: new Date(Date.now() - 300000).toISOString(),
        description: 'Bottom-up auction room for buyer-side timer and bid testing.',
        auctionDuration: 10,
        bottomUp: {
          startPrice: 80000,
          bidUnit: 5000,
        },
        uniqueTop: null,
        images: ['https://picsum.photos/seed/buyer-test-1/400/400', 'https://picsum.photos/seed/buyer-test-2/400/400'],
      },
      {
        itemId: 602,
        name: 'Buyer test backup lot',
        category: 'SNEAKERS_SHOES',
        status: 'READY',
        auctionType: 'BOTTOM_UP',
        itemCondition: 'OPEN_BOX',
        image1: Usagi,
        createdAt: new Date(Date.now() - 240000).toISOString(),
        description: 'Second lot kept ready for manual follow-up testing.',
        auctionDuration: 15,
        bottomUp: {
          startPrice: 120000,
          bidUnit: 10000,
        },
        uniqueTop: null,
        images: ['https://picsum.photos/seed/buyer-test-3/400/400', 'https://picsum.photos/seed/buyer-test-4/400/400'],
      },
    ],
    sellerId: 12,
    sellerNickname: 'sneaker_room',
    sellerProfileImage: 'https://picsum.photos/seed/seller-12/120/120',
  },
];

let nextLiveId = 7;

const parseStreamRequest = async (request: Request) => {
  let body: StreamRequest;
  let thumbnailUrl: string | null = null;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const requestPart = formData.get('request');
    const text = requestPart instanceof Blob ? await requestPart.text() : (requestPart as string);
    body = JSON.parse(text) as StreamRequest;

    const thumbnailFile = formData.get('thumbnail');
    if (thumbnailFile instanceof Blob) {
      const buffer = await thumbnailFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';

      for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
      }

      thumbnailUrl = `data:${thumbnailFile.type || 'image/png'};base64,${btoa(binary)}`;
    }
  } else {
    body = (await request.json()) as StreamRequest;
  }

  return { body, thumbnailUrl };
};

export const LiveCreateHandlers = [
  http.get(`${BASE_URL}/v1/streams/scheduled`, ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(0, Number(url.searchParams.get('page') ?? '0'));
    const size = Math.max(1, Number(url.searchParams.get('size') ?? '8'));
    const currentSellerId = getCurrentSellerId();

    const streams = registeredLives
      .filter((live) => live.sellerId === currentSellerId)
      .map((live) => ({
        streamId: live.streamId,
        title: live.title,
        shopName: live.sellerNickname,
        category: live.category,
        thumbnail: live.thumbnail,
        scheduledAt: live.scheduledAt,
        state: getRegisteredLiveState(live),
      }));

    const start = page * size;
    const end = start + size;
    return HttpResponse.json({ streams: streams.slice(start, end), hasNext: end < streams.length });
  }),

  http.get(`${BASE_URL}/v1/streams/:streamId`, ({ params }) => {
    const streamId = Number(params.streamId);
    const live = getRegisteredLiveById(streamId);

    if (!live) {
      return HttpResponse.json({ message: 'Stream not found' }, { status: 404 });
    }

    if (live.sellerId !== getCurrentSellerId()) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return HttpResponse.json(
      {
        streamId: live.streamId,
        title: live.title,
        category: live.category,
        thumbnail: live.thumbnail,
        scheduledAt: live.scheduledAt,
        startType: live.startType,
        notice: live.notice,
        isLive: live.isLive,
        createdAt: live.createdAt,
        items: live.items.map((item) => toStreamDetailItem(live, item)),
      } satisfies StreamDetailResponse,
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/streams`, async ({ request }) => {
    const { body, thumbnailUrl } = await parseStreamRequest(request);
    const sellerSnapshot = getCurrentSellerSnapshot();
    const newId = nextLiveId++;
    const newLive: RegisteredLive = {
      streamId: newId,
      title: body.title,
      category: body.category,
      thumbnail: thumbnailUrl,
      scheduledAt: body.scheduledAt || null,
      startType: body.startType,
      notice: body.notice ?? null,
      isLive: false,
      createdAt: new Date().toISOString(),
      items: createStreamItems(body.auctionItems, body.category, thumbnailUrl),
      ...sellerSnapshot,
    };

    registeredLives.push(newLive);

    return HttpResponse.json(
      {
        streamId: newId,
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/streams/:streamId/start`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const { body, thumbnailUrl } = await parseStreamRequest(request);
    const existingLive = getRegisteredLiveById(streamId);

    if (existingLive && existingLive.sellerId !== getCurrentSellerId()) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const sellerSnapshot = existingLive
      ? {
          sellerId: existingLive.sellerId,
          sellerNickname: existingLive.sellerNickname,
          sellerProfileImage: existingLive.sellerProfileImage,
        }
      : getCurrentSellerSnapshot();
    const resolvedThumbnail = thumbnailUrl ?? existingLive?.thumbnail ?? null;

    if (!existingLive) {
      registeredLives.push({
        streamId,
        title: body.title,
        category: body.category,
        thumbnail: resolvedThumbnail,
        scheduledAt: body.scheduledAt || null,
        startType: body.startType,
        notice: body.notice ?? null,
        isLive: true,
        createdAt: new Date().toISOString(),
        items: createStreamItems(body.auctionItems, body.category, resolvedThumbnail),
        ...sellerSnapshot,
      });
    } else {
      const liveIndex = registeredLives.findIndex((item) => item.streamId === streamId);

      if (liveIndex !== -1) {
        registeredLives[liveIndex] = {
          ...registeredLives[liveIndex],
          title: body.title,
          category: body.category,
          thumbnail: resolvedThumbnail,
          scheduledAt: body.scheduledAt || null,
          startType: body.startType,
          notice: body.notice ?? null,
          isLive: true,
          items: createStreamItems(body.auctionItems, body.category, resolvedThumbnail),
        };
      }
    }

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Stream started successfully.',
        data: {
          status: 'live',
          rtcConfig: {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            sessionId: `openvidu-session-${streamId}`,
          },
          openviduToken: `wss://mock-openvidu-server:4443?sessionId=session-${streamId}&token=mock-token-${Date.now()}`,
        },
      },
      { status: 200 },
    );
  }),

  http.patch(`${BASE_URL}/v1/streams/:streamId`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const { body, thumbnailUrl } = await parseStreamRequest(request);
    const liveIndex = registeredLives.findIndex((item) => item.streamId === streamId);

    if (liveIndex !== -1 && registeredLives[liveIndex].sellerId !== getCurrentSellerId()) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (liveIndex !== -1) {
      const resolvedThumbnail = thumbnailUrl ?? registeredLives[liveIndex].thumbnail;
      registeredLives[liveIndex] = {
        ...registeredLives[liveIndex],
        title: body.title,
        category: body.category,
        thumbnail: resolvedThumbnail,
        startType: body.startType,
        scheduledAt: body.scheduledAt || null,
        notice: body.notice ?? null,
        items: createStreamItems(body.auctionItems, body.category, resolvedThumbnail),
      };
    }

    const response: UpdateStreamResponse = {
      streamId,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.delete(`${BASE_URL}/v1/streams/:streamId`, ({ params }) => {
    const streamId = Number(params.streamId);
    const liveIndex = registeredLives.findIndex((item) => item.streamId === streamId);

    if (liveIndex !== -1 && registeredLives[liveIndex].sellerId !== getCurrentSellerId()) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (liveIndex !== -1) {
      registeredLives.splice(liveIndex, 1);
    }

    const response: DeleteStreamResponse = {
      streamId,
      status: 'cancelled',
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/streams/:streamId/end`, ({ params }) => {
    const streamId = Number(params.streamId);
    const liveIndex = registeredLives.findIndex((item) => item.streamId === streamId);

    if (liveIndex !== -1 && registeredLives[liveIndex].sellerId !== getCurrentSellerId()) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (liveIndex !== -1) {
      registeredLives.splice(liveIndex, 1);
    }

    const response: EndStreamResponse = {
      streamId,
      status: 'ended',
    };

    return HttpResponse.json(response, { status: 200 });
  }),
];
