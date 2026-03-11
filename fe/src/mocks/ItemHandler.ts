import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import Logo from '@/assets/Logo.png';

type MockItem = {
  id: number;
  status: string;
  title: string;
  description: string;
  tags: string[];
  imageUrls: string[];
  startPrice: number;
  bidUnit?: number;
  auctionTime?: number;
  condition?: string;
  category?: string;
  auctionMethod?: string;
};

let mockItems: MockItem[] = [
  {
    id: 1,
    status: 'ready',
    title: '나이키 에어포스 1',
    description: '상태 좋은 265mm',
    tags: ['nike', 'sneakers'],
    imageUrls: [Logo],
    startPrice: 100000,
    bidUnit: 5000,
    auctionTime: 30,
    condition: 'S',
    category: 'SNEAKERS_SHOES',
    auctionMethod: 'ENGLISH',
  },
  {
    id: 2,
    status: 'ready',
    title: '나이키 조던 1 하이 시카고',
    description: '박스 풀구성 깔끔해요',
    tags: ['jordan', 'chicago'],
    imageUrls: [Logo],
    startPrice: 500000,
    bidUnit: 10000,
    auctionTime: 60,
    condition: 'A',
    category: 'SNEAKERS_SHOES',
    auctionMethod: 'ENGLISH',
  },
  {
    id: 3,
    status: 'ready',
    title: '아디다스 이지 부스트 350',
    description: '실착 5회 미만',
    tags: ['adidas', 'yeezy'],
    imageUrls: [Logo],
    startPrice: 200000,
    bidUnit: 5000,
    auctionTime: 30,
    condition: 'A',
    category: 'SNEAKERS_SHOES',
    auctionMethod: 'ENGLISH',
  },
  {
    id: 4,
    status: 'ready',
    title: '롤렉스 서브마리너 데이트',
    description: '2021년식 풀세트 보증서 유',
    tags: ['rolex', 'submariner'],
    imageUrls: [Logo],
    startPrice: 15000000,
    bidUnit: 100000,
    auctionTime: 60,
    condition: 'S',
    category: 'WATCHES',
    auctionMethod: 'ENGLISH',
  },
  {
    id: 5,
    status: 'ready',
    title: '에르메스 버킨 30',
    description: '금장 토고 레더',
    tags: ['hermes', 'birkin'],
    imageUrls: [Logo],
    startPrice: 20000000,
    bidUnit: 200000,
    auctionTime: 60,
    condition: 'S',
    category: 'BAGS_FASHION_ACCESSORIES',
    auctionMethod: 'ENGLISH',
  },
];

const getCategoryName = (categoryId?: number) => {
  if (categoryId === 1) return 'SNEAKERS_SHOES';
  if (categoryId === 3) return 'WATCHES';
  return 'ETC';
};

export const itemHandlers = [
  http.get(`${BASE_URL}/v1/items`, async ({ request }) => {
    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get('category');
    const filtered = categoryFilter
      ? mockItems.filter((item) => item.category === categoryFilter)
      : mockItems;
    return HttpResponse.json(filtered);
  }),

  http.post(`${BASE_URL}/v1/items`, async ({ request }) => {
    const formData = await request.formData();
    const tags = formData.getAll('tags') as string[];
    const newImages = formData.getAll('newImages');
    const imageUrls =
      newImages.length > 0
        ? newImages.map((file) => URL.createObjectURL(file as Blob))
        : ['https://via.placeholder.com/160x160?text=Mock+Image'];

    const newItem: MockItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      status: 'WAITING',
      title: (formData.get('title') as string) || 'Mock Uploaded Item',
      description: (formData.get('description') as string) || 'Mock Description',
      tags: tags.length > 0 ? tags : ['vintage', 'rare'],
      imageUrls,
      startPrice: Number(formData.get('startPrice')) || 0,
      bidUnit: Number(formData.get('bidUnit')) || 1000,
      auctionTime: Number(formData.get('auctionDuration')) || 60,
      condition: 'USED',
      category: getCategoryName(Number(formData.get('categoryId')) || undefined),
      auctionMethod: 'ENGLISH',
    };

    mockItems.push(newItem);

    return HttpResponse.json({
      itemId: newItem.id,
      title: newItem.title,
      status: newItem.status,
    });
  }),

  http.patch(`${BASE_URL}/v1/items/:itemId`, async ({ request, params }) => {
    const itemId = Number(params.itemId);
    const itemIndex = mockItems.findIndex((item) => item.id === itemId);

    if (itemIndex < 0) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const currentItem = mockItems[itemIndex];
    const tags = formData.getAll('tags') as string[];
    const existingImageUrls = formData.getAll('existingImageUrls') as string[];
    const newImages = formData.getAll('newImages');
    const nextImageUrls =
      existingImageUrls.length > 0
        ? [...existingImageUrls, ...newImages.map((file) => URL.createObjectURL(file as Blob))]
        : newImages.length > 0
          ? newImages.map((file) => URL.createObjectURL(file as Blob))
          : currentItem.imageUrls;

    mockItems[itemIndex] = {
      ...currentItem,
      title: (formData.get('title') as string) || currentItem.title,
      description: (formData.get('description') as string) || currentItem.description,
      tags: tags.length > 0 ? tags : currentItem.tags,
      imageUrls: nextImageUrls,
      startPrice: formData.get('startPrice') ? Number(formData.get('startPrice')) : currentItem.startPrice,
      bidUnit: formData.get('bidUnit') ? Number(formData.get('bidUnit')) : currentItem.bidUnit,
      auctionTime: formData.get('auctionDuration') ? Number(formData.get('auctionDuration')) : currentItem.auctionTime,
      condition: (formData.get('condition') as string) || currentItem.condition,
      category: formData.get('categoryId')
        ? getCategoryName(Number(formData.get('categoryId')))
        : currentItem.category,
      auctionMethod: (formData.get('auctionMethod') as string) || currentItem.auctionMethod,
    };

    return HttpResponse.json({
      itemId,
      title: mockItems[itemIndex].title,
      status: 'ready',
    });
  }),

  http.delete(`${BASE_URL}/v1/items/:itemId`, async ({ params }) => {
    const itemId = Number(params.itemId);
    mockItems = mockItems.filter((item) => item.id !== itemId);

    return HttpResponse.json({
      itemId,
      status: 'cancelled',
    });
  }),
];
