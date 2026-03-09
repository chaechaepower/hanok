import { mainHandlers } from './MainHandler';

import { http, HttpResponse } from 'msw';
import { BASE_URL } from '@/api/instance';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockItems: any[] = [];
const mockWallet = {
  balance: 1250000,
  depositedAuctionBalance: 250000,
};
const mockPendingWalletCharges = new Map<string, number>();
const mockAccount = {
  bankName: '신한은행',
  accountNumber: '123-123-412890',
};
const mockTradeReports = {
  CHARGE: [
    {
      itemName: null,
      amount: 100000,
      createdAt: '2026-03-05 08:15:30',
    },
    {
      itemName: null,
      amount: 50000,
      createdAt: '2026-03-04 14:22:10',
    },
  ],
  WITHDRAW: [
    {
      itemName: null,
      amount: 500000,
      createdAt: '2026-03-02 14:20:00',
    },
    {
      itemName: null,
      amount: 250000,
      createdAt: '2026-03-01 10:24:00',
    },
  ],
  SETTLEMENT: [
    {
      itemName: '빈티지 카메라',
      amount: -500000,
      createdAt: '2026-03-05 11:32:00',
    },
    {
      itemName: '빈티지 카메라',
      amount: 320000,
      createdAt: '2026-03-02 19:40:00',
    },
  ],
};

export const handlers = [
  ...mainHandlers,

  // -- Item CRUD Mocks --
  http.get(`${BASE_URL}/v1/items`, async () => {
    return HttpResponse.json(mockItems);
  }),

  http.get(`${BASE_URL}/v1/wallet`, async () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: mockWallet,
    });
  }),

  http.post(`${BASE_URL}/v1/wallet/charges`, async ({ request }) => {
    const body = (await request.json()) as { amount?: number };
    const amount = Number(body.amount ?? 0);
    const paymentId = Date.now().toString();

    mockPendingWalletCharges.set(paymentId, amount);

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: { paymentId },
    });
  }),

  http.post(`${BASE_URL}/v1/wallet/charges/complete`, async ({ request }) => {
    const body = (await request.json()) as { paymentId?: string | number };
    const paymentId = String(body.paymentId ?? '');
    const amount = mockPendingWalletCharges.get(paymentId) ?? 0;

    if (amount > 0) {
      mockWallet.balance += amount;
      mockTradeReports.CHARGE.unshift({
        itemName: null,
        amount,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      mockPendingWalletCharges.delete(paymentId);
    }

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: null,
    });
  }),

  http.post(`${BASE_URL}/v1/wallet/withdrawals`, async ({ request }) => {
    const body = (await request.json()) as { amount?: number };
    const amount = Number(body.amount ?? 0);

    if (amount > 0) {
      mockWallet.balance = Math.max(mockWallet.balance - amount, 0);
      mockTradeReports.WITHDRAW.unshift({
        itemName: null,
        amount,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: null,
    });
  }),

  http.get(`${BASE_URL}/v1/users/me/account`, async () => {
    return HttpResponse.json(mockAccount);
  }),

  http.get(`${BASE_URL}/v1/trade/reports`, async ({ request }) => {
    const url = new URL(request.url);
    const type = (url.searchParams.get('type') ?? 'CHARGE').toUpperCase() as keyof typeof mockTradeReports;

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: mockTradeReports[type] ?? [],
    });
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
      status: 'WAITING', // default status
      title,
      description,
      tags: tags.length > 0 ? tags : ['신규등록', '테스트'], // default if empty
      imageUrls,
      startPrice,
      bidUnit,
      auctionTime,
      condition: '새상품',
      category: categoryName,
      auctionMethod: '영국식',
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

    // Additional editable fields
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
    const auctionMethod =
      auctionMethodRaw === 'english' ? '영국식' : auctionMethodRaw === 'dutch' ? '내림차순' : undefined;
    const categoryName = category ? (category === 1 ? '패션/잡화' : category === 3 ? '수집품' : '전자기기') : undefined;

    const itemIndex = mockItems.findIndex((i) => i.id === id);
    if (itemIndex > -1) {
      const itemToUpdate = mockItems[itemIndex];

      const newImages = formData.getAll('newImages');
      const existingImageUrls = formData.getAll('existingImageUrls') as string[];
      let imageUrls: string[] = existingImageUrls.length > 0 ? [...existingImageUrls] : [];

      if (newImages && newImages.length > 0) {
        newImages.forEach((file) => {
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
        tags: tags.length > 0 ? tags : itemToUpdate.tags, // override tags or keep old
        imageUrls: imageUrls,
        startPrice: startPrice !== undefined ? startPrice : itemToUpdate.startPrice,
        bidUnit: bidUnit !== undefined ? bidUnit : itemToUpdate.bidUnit,
        auctionTime: auctionTime !== undefined ? auctionTime : itemToUpdate.auctionTime,
        condition: condition !== undefined ? condition : itemToUpdate.condition,
        category: categoryName !== undefined ? categoryName : itemToUpdate.category,
        auctionMethod: auctionMethod !== undefined ? auctionMethod : itemToUpdate.auctionMethod,
      };

      return HttpResponse.json({
        itemId: id,
        title: mockItems[itemIndex].title,
        status: 'ready',
      });
    }

    return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
  }),

  http.delete(`${BASE_URL}/v1/items/:itemId`, async ({ params }) => {
    const id = Number(params.itemId);
    mockItems = mockItems.filter((i) => i.id !== id);
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
