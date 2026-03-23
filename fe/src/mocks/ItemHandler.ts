import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import Logo from '@/assets/Logo.png';
import type { ItemSyncItemCondition } from '@/types';

type MockItem = {
  itemId: number;
  status: string;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  itemCondition: ItemSyncItemCondition;
  category: string;
  createdAt: string;
};

const fileToDataUrl = async (file: Blob) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return `data:${file.type || 'image/png'};base64,${btoa(binary)}`;
};

let mockItems: MockItem[] = [
  {
    itemId: 1,
    status: 'READY',
    name: '나이키 에어포스 1',
    description: '상태 좋은 265mm',
    tags: ['nike', 'sneakers'],
    images: [Logo, Logo, Logo],
    itemCondition: 'BRAND_NEW',
    category: 'SNEAKERS_SHOES',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 2,
    status: 'READY',
    name: '나이키 조던 1 하이 시카고',
    description: '박스 풀구성 깔끔해요',
    tags: ['jordan', 'chicago'],
    images: [Logo, Logo, Logo],
    itemCondition: 'OPEN_BOX',
    category: 'SNEAKERS_SHOES',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 3,
    status: 'PENDING',
    name: '아디다스 이지 부스트 350',
    description: '실착 5회 미만',
    tags: ['adidas', 'yeezy'],
    images: [Logo, Logo, Logo],
    itemCondition: 'USED',
    category: 'SNEAKERS_SHOES',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 4,
    status: 'PENDING',
    name: '롤렉스 서브마리너 데이트',
    description: '2021년식 풀세트 보증서 유',
    tags: ['rolex', 'submariner'],
    images: [Logo, Logo, Logo],
    itemCondition: 'BRAND_NEW',
    category: 'WATCHES',
    createdAt: '2026-03-13T05:25:50.043Z',
  },
  {
    itemId: 5,
    status: 'SOLD',
    name: '에르메스 버킨 30',
    description: '금장 토고 레더',
    tags: ['hermes', 'birkin'],
    images: [Logo, Logo, Logo],
    itemCondition: 'BRAND_NEW',
    category: 'BAGS_FASHION_ACCESSORIES',
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
    const uploadedImages = await Promise.all(
      formData
        .getAll('images')
        .filter((file): file is File => file instanceof File && file.size > 0)
        .slice(0, 3)
        .map((file) => fileToDataUrl(file)),
    );

    const newItem: MockItem = {
      itemId: Date.now() + Math.floor(Math.random() * 1000),
      status: 'READY',
      name: (body.name as string) || 'Mock Item',
      description: (body.description as string) || 'Mock Description',
      tags: (body.tags as string[]) || [],
      images: uploadedImages.length > 0 ? uploadedImages : [Logo, Logo, Logo],
      itemCondition: ((body.itemCondition as ItemSyncItemCondition | undefined) ?? 'USED'),
      category: (body.category as string) || 'ETC',
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
    const requestedImages = Array.isArray(body.images) ? body.images : currentItem.images;
    const nextImages = (
      await Promise.all(
        [1, 2, 3].map(async (slot) => {
          const uploadedFile = formData.get(`image${slot}`);

          if (uploadedFile instanceof File && uploadedFile.size > 0) {
            return fileToDataUrl(uploadedFile);
          }

          const requestedImage = requestedImages[slot - 1];
          return typeof requestedImage === 'string' && requestedImage ? requestedImage : null;
        }),
      )
    )
      .filter((image): image is string => Boolean(image));

    mockItems[itemIndex] = {
      ...currentItem,
      name: (body.name as string) || currentItem.name,
      description: (body.description as string) || currentItem.description,
      tags: (body.tags as string[]) || currentItem.tags,
      itemCondition: ((body.itemCondition as ItemSyncItemCondition | undefined) ?? currentItem.itemCondition),
      category: (body.category as string) || currentItem.category,
      images: nextImages,
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
