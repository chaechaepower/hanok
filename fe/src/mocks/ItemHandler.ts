import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import Logo from '@/assets/Logo.png';
import type { ItemAuctionType, ItemSyncItemCondition } from '@/types';

type MockItem = {
  itemId: number;
  status: string;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  startPrice: number;
  minPrice: number | null;
  maxPrice: number | null;
  bidUnit: number;
  auctionDuration: number;
  itemCondition: ItemSyncItemCondition;
  category: string;
  auctionType: ItemAuctionType;
  createdAt: string;
};

let mockItems: MockItem[] = [
  {
    itemId: 1,
    status: 'READY',
    name: '나이키 에어포스 1',
    description: '상태 좋은 265mm',
    tags: ['nike', 'sneakers'],
    images: [Logo, Logo, Logo],
    startPrice: 100000,
    minPrice: 1000,
    maxPrice: 100000,
    bidUnit: 5000,
    auctionDuration: 30,
    itemCondition: 'BRAND_NEW',
    category: 'SNEAKERS_SHOES',
    auctionType: 'UNIQUE_TOP',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 2,
    status: 'READY',
    name: '나이키 조던 1 하이 시카고',
    description: '박스 풀구성 깔끔해요',
    tags: ['jordan', 'chicago'],
    images: [Logo, Logo, Logo],
    startPrice: 500000,
    minPrice: null,
    maxPrice: null,
    bidUnit: 10000,
    auctionDuration: 60,
    itemCondition: 'OPEN_BOX',
    category: 'SNEAKERS_SHOES',
    auctionType: 'BOTTOM_UP',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 3,
    status: 'PENDING',
    name: '아디다스 이지 부스트 350',
    description: '실착 5회 미만',
    tags: ['adidas', 'yeezy'],
    images: [Logo, Logo, Logo],
    startPrice: 200000,
    minPrice: null,
    maxPrice: null,
    bidUnit: 5000,
    auctionDuration: 30,
    itemCondition: 'USED',
    category: 'SNEAKERS_SHOES',
    auctionType: 'BOTTOM_UP',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 4,
    status: 'PENDING',
    name: '롤렉스 서브마리너 데이트',
    description: '2021년식 풀세트 보증서 유',
    tags: ['rolex', 'submariner'],
    images: [Logo, Logo, Logo],
    startPrice: 15000000,
    minPrice: null,
    maxPrice: null,
    bidUnit: 100000,
    auctionDuration: 60,
    itemCondition: 'BRAND_NEW',
    category: 'WATCHES',
    auctionType: 'BOTTOM_UP',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 5,
    status: 'SOLD',
    name: '에르메스 버킨 30',
    description: '금장 토고 레더',
    tags: ['hermes', 'birkin'],
    images: [Logo, Logo, Logo],
    startPrice: 20000000,
    minPrice: null,
    maxPrice: null,
    bidUnit: 200000,
    auctionDuration: 60,
    itemCondition: 'BRAND_NEW',
    category: 'BAGS_FASHION_ACCESSORIES',
    auctionType: 'BOTTOM_UP',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
];

export const getMockItemById = (itemId: number) => mockItems.find((item) => item.itemId === itemId);

export const itemHandlers = [
  http.get(`${BASE_URL}/v1/items`, async ({ request }) => {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    const filtered = statusFilter ? mockItems.filter((item) => item.status === statusFilter) : mockItems;
    return HttpResponse.json(filtered);
  }),

  http.post(`${BASE_URL}/v1/items`, async ({ request }) => {
    const formData = await request.formData();
    const requestBlob = formData.get('request');
    const body = requestBlob ? (JSON.parse(await (requestBlob as Blob).text()) as Record<string, unknown>) : {};

    const newItem: MockItem = {
      itemId: Date.now() + Math.floor(Math.random() * 1000),
      status: 'READY',
      name: (body.name as string) || 'Mock Item',
      description: (body.description as string) || 'Mock Description',
      tags: (body.tags as string[]) || [],
      images: [Logo, Logo, Logo],
      startPrice: body.startPrice == null ? 0 : Number(body.startPrice),
      minPrice: body.minPrice == null ? null : Number(body.minPrice),
      maxPrice: body.maxPrice == null ? null : Number(body.maxPrice),
      bidUnit: body.bidUnit == null ? 0 : Number(body.bidUnit),
      auctionDuration: Number(body.auctionDuration) || 60,
      itemCondition: ((body.itemCondition as ItemSyncItemCondition | undefined) ?? 'USED'),
      category: (body.category as string) || 'ETC',
      auctionType: (body.auctionType as ItemAuctionType) || 'BOTTOM_UP',
      createdAt: new Date().toISOString(),
    };

    mockItems.push(newItem);

    return HttpResponse.json({
      itemId: newItem.itemId,
      name: newItem.name,
      status: newItem.status,
    });
  }),

  http.patch(`${BASE_URL}/v1/items/:itemId`, async ({ request, params }) => {
    const itemId = Number(params.itemId);
    const itemIndex = mockItems.findIndex((item) => item.itemId === itemId);

    if (itemIndex < 0) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const requestBlob = formData.get('request');
    const body = requestBlob ? (JSON.parse(await (requestBlob as Blob).text()) as Record<string, unknown>) : {};
    const currentItem = mockItems[itemIndex];

    mockItems[itemIndex] = {
      ...currentItem,
      name: (body.name as string) || currentItem.name,
      description: (body.description as string) || currentItem.description,
      tags: (body.tags as string[]) || currentItem.tags,
      startPrice: body.startPrice ? Number(body.startPrice) : currentItem.startPrice,
      bidUnit: body.bidUnit ? Number(body.bidUnit) : currentItem.bidUnit,
      auctionDuration: body.auctionDuration ? Number(body.auctionDuration) : currentItem.auctionDuration,
      itemCondition: ((body.itemCondition as ItemSyncItemCondition | undefined) ?? currentItem.itemCondition),
      category: (body.category as string) || currentItem.category,
    };

    return HttpResponse.json({
      itemId,
      name: mockItems[itemIndex].name,
      status: mockItems[itemIndex].status,
    });
  }),

  http.delete(`${BASE_URL}/v1/items/:itemId`, async ({ params }) => {
    const itemId = Number(params.itemId);
    mockItems = mockItems.filter((item) => item.itemId !== itemId);

    return HttpResponse.json({ itemId, status: 'DELETED' });
  }),
];
