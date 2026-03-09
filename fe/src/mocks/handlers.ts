import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

import { mainHandlers } from './MainHandler';
import { walletHandlers } from './WalletHandler';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockItems: any[] = [];

export const handlers = [
  ...mainHandlers,
  ...walletHandlers,

  http.get(`${BASE_URL}/v1/items`, async () => {
    return HttpResponse.json(mockItems);
  }),

  http.post(`${BASE_URL}/v1/items`, async ({ request }) => {
    const formData = await request.formData();
    const title = (formData.get('title') as string) || 'Mock Uploaded Item';
    const description = (formData.get('description') as string) || 'Mock Description';
    const startPrice = Number(formData.get('startPrice')) || 0;
    const bidUnit = Number(formData.get('bidUnit'));
    const auctionTime = Number(formData.get('auctionDuration'));
    const category = Number(formData.get('categoryId'));
    const categoryName = category === 1 ? '패션/잡화' : category === 3 ? '수집품' : '전자기기';
    const newImages = formData.getAll('newImages');
    let imageUrls: string[] = [];

    if (newImages.length > 0) {
      imageUrls = newImages.map((file) => URL.createObjectURL(file as Blob));
    } else {
      imageUrls = ['https://via.placeholder.com/160x160?text=Mock+Image'];
    }

    const tags = formData.getAll('tags') as string[];

    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      status: 'WAITING',
      title,
      description,
      tags: tags.length > 0 ? tags : ['신규등록', '테스트'],
      imageUrls,
      startPrice,
      bidUnit,
      auctionTime,
      condition: '정상',
      category: categoryName,
      auctionMethod: '경매',
    };

    mockItems.push(newItem);

    return HttpResponse.json({
      itemId: newItem.id,
      title: newItem.title,
      status: newItem.status,
    });
  }),

  http.put(`${BASE_URL}/v1/items/:itemId`, async ({ request, params }) => {
    const id = Number(params.itemId);
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.getAll('tags') as string[];
    const startPrice = formData.get('startPrice') ? Number(formData.get('startPrice')) : undefined;
    const bidUnit = formData.get('bidUnit') ? Number(formData.get('bidUnit')) : undefined;
    const auctionTime = formData.get('auctionDuration') ? Number(formData.get('auctionDuration')) : undefined;
    const category = formData.get('categoryId') ? Number(formData.get('categoryId')) : undefined;
    const conditionRaw = formData.get('condition') as string;
    const auctionMethodRaw = formData.get('auctionMethod') as string;

    const condition =
      conditionRaw === 'new'
        ? '새상품'
        : conditionRaw === 'like-new'
          ? '거의 새것'
          : conditionRaw === 'used'
            ? '사용감 있음'
            : undefined;
    
    const categoryName = category
      ? category === 1
        ? '패션/잡화'
        : category === 3
          ? '수집품'
          : '전자기기'
      : undefined;

    const auctionMethod =
      auctionMethodRaw === 'english' ? '경매' : auctionMethodRaw === 'dutch' ? '네덜란드식' : undefined;

    const itemIndex = mockItems.findIndex(i => i.id === id);
    if (itemIndex > -1) {
      const itemToUpdate = mockItems[itemIndex];
      
      const newImages = formData.getAll('newImages');
      const existingImageUrls = formData.getAll('existingImageUrls') as string[];
      let imageUrls: string[] = existingImageUrls.length > 0 ? [...existingImageUrls] : [];
      
      if (newImages && newImages.length > 0) {
        newImages.forEach(file => {
           imageUrls.push(URL.createObjectURL(file as Blob));
        });
      }
      if (imageUrls.length === 0 && itemToUpdate.imageUrls && itemToUpdate.imageUrls.length > 0) {
          imageUrls = itemToUpdate.imageUrls;
      }

      mockItems[itemIndex] = {
        ...itemToUpdate,
        title: title || itemToUpdate.title,
        description: description || itemToUpdate.description,
        tags: tags.length > 0 ? tags : itemToUpdate.tags,
        imageUrls,
        startPrice: startPrice !== undefined ? startPrice : itemToUpdate.startPrice,
        bidUnit: bidUnit !== undefined ? bidUnit : itemToUpdate.bidUnit,
        auctionTime: auctionTime !== undefined ? auctionTime : itemToUpdate.auctionTime,
        condition: condition !== undefined ? condition : itemToUpdate.condition,
        category: categoryName !== undefined ? categoryName : itemToUpdate.category,
        auctionMethod: auctionMethod !== undefined ? auctionMethod : itemToUpdate.auctionMethod,
      };
    };
    return HttpResponse.json({
      itemId: id,
      title: mockItems[itemIndex].title,
      status: 'ready',
    });
  }),

  http.delete(`${BASE_URL}/v1/items/:itemId`, async ({ params }) => {
    const id = Number(params.itemId);
    mockItems = mockItems.filter((item) => item.id !== id);

    return HttpResponse.json({
      itemId: id,
      status: 'cancelled',
    });
  }),

  http.post(`${BASE_URL}/v1/sellers/register`, async () => {
    return HttpResponse.json(
      {
        sellerId: 101,
        nickname: 'Mock 판매자',
        grade: 'A',
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/sellers/account`, async () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(`${BASE_URL}/v1/users/me/seller-status`, async () => {
    return HttpResponse.json({
      isSeller: false,
    });
  }),
];
