import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

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

let mockItems: MockItem[] = [];

const getCategoryName = (categoryId?: number) => {
  if (categoryId === 1) return 'SNEAKERS';
  if (categoryId === 3) return 'WATCH';
  return 'COLLECTIBLE';
};

export const itemHandlers = [
  http.get(`${BASE_URL}/v1/items`, async () => {
    return HttpResponse.json(mockItems);
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
