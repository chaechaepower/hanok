import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

const mockBuyerEscrows = [
  {
    escrowId: 100,
    image: 'https://picsum.photos/seed/camera/140/140',
    itemName: 'Vintage Camera',
    amount: 250000,
    escrowStatus: 'DEPOSITED',
    createdAt: '2026-03-15T08:15:30Z',
  },
  {
    escrowId: 101,
    image: 'https://picsum.photos/seed/shoes/140/140',
    itemName: 'Vintage Sneakers',
    amount: 75000,
    escrowStatus: 'SHIPPED',
    createdAt: '2026-03-01T23:00:00Z',
  },
  {
    escrowId: 102,
    image: 'https://picsum.photos/seed/jacket/140/140',
    itemName: 'Collector Jacket',
    amount: 120000,
    escrowStatus: 'COMPLETED',
    createdAt: '2026-02-20T19:30:00Z',
  },
];

const mockSellerEscrows = [
  {
    escrowId: 201,
    image: 'https://picsum.photos/seed/watch/140/140',
    itemName: 'Rolex Datejust',
    amount: 920000,
    escrowStatus: 'DEPOSITED',
    createdAt: '2026-03-16T09:20:00Z',
  },
  {
    escrowId: 202,
    image: 'https://picsum.photos/seed/card/140/140',
    itemName: 'Pokemon Card Charizard',
    amount: 180000,
    escrowStatus: 'SHIPPED',
    createdAt: '2026-03-10T14:10:00Z',
  },
  {
    escrowId: 203,
    image: 'https://picsum.photos/seed/bag/140/140',
    itemName: 'Luxury Handbag',
    amount: 420000,
    escrowStatus: 'COMPLETED',
    createdAt: '2026-03-08T11:05:00Z',
  },
  {
    escrowId: 204,
    image: 'https://picsum.photos/seed/figure/140/140',
    itemName: 'Limited Figure',
    amount: 135000,
    escrowStatus: 'CANCELLED',
    createdAt: '2026-03-05T17:40:00Z',
  },
];

const detailMap: Record<
  string,
  {
    image: string;
    itemName: string;
    finalPrice: number;
    wonAt: string;
    courierName?: string;
    trackingNumber?: string;
  }
> = {
  '100': {
    image: 'https://picsum.photos/seed/camera/140/140',
    itemName: 'Vintage Camera',
    finalPrice: 250000,
    wonAt: '2026-03-15T08:15:30Z',
  },
  '101': {
    image: 'https://picsum.photos/seed/shoes/140/140',
    itemName: 'Vintage Sneakers',
    finalPrice: 75000,
    wonAt: '2026-03-01T23:00:00Z',
    courierName: 'CJ대한통운',
    trackingNumber: '521465873135',
  },
  '102': {
    image: 'https://picsum.photos/seed/jacket/140/140',
    itemName: 'Collector Jacket',
    finalPrice: 120000,
    wonAt: '2026-02-20T19:30:00Z',
    courierName: 'CJ대한통운',
    trackingNumber: '521465873135',
  },
  '201': {
    image: 'https://picsum.photos/seed/watch/140/140',
    itemName: 'Rolex Datejust',
    finalPrice: 920000,
    wonAt: '2026-03-16T09:20:00Z',
  },
  '202': {
    image: 'https://picsum.photos/seed/card/140/140',
    itemName: 'Pokemon Card Charizard',
    finalPrice: 180000,
    wonAt: '2026-03-10T14:10:00Z',
    courierName: 'CJ대한통운',
    trackingNumber: '521465873135',
  },
  '203': {
    image: 'https://picsum.photos/seed/bag/140/140',
    itemName: 'Luxury Handbag',
    finalPrice: 420000,
    wonAt: '2026-03-08T11:05:00Z',
    courierName: 'CJ대한통운',
    trackingNumber: '521465873135',
  },
  '204': {
    image: 'https://picsum.photos/seed/figure/140/140',
    itemName: 'Limited Figure',
    finalPrice: 135000,
    wonAt: '2026-03-05T17:40:00Z',
  },
};

export const escrowHandlers = [
  http.get(`${BASE_URL}/v1/escrows/buyer`, () =>
    HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Buyer escrow list fetched successfully.',
        data: mockBuyerEscrows,
      },
      { status: 200 },
    ),
  ),

  http.get(`${BASE_URL}/v1/escrows/seller`, () =>
    HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Seller escrow list fetched successfully.',
        data: mockSellerEscrows,
      },
      { status: 200 },
    ),
  ),

  http.get(`${BASE_URL}/v1/escrows/:escrowId`, ({ params }) => {
    const escrowId = String(params.escrowId);
    const detail = detailMap[escrowId] ?? detailMap['100'];

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Escrow detail fetched successfully.',
        data: {
          winningInfo: {
            image: detail.image,
            itemName: detail.itemName,
            finalPrice: detail.finalPrice,
            sellerName: 'Mock Seller',
            sellerId: 'seller_1',
            wonAt: detail.wonAt,
          },
          shippingAddress: {
            name: 'Mock User',
            phone: '010-3134-6396',
            postalCode: '03154',
            address: '123 Mock Street',
            addressDetail: '405-107',
          },
          delivery: detail.courierName
            ? {
                courierName: detail.courierName,
                trackingNumber: detail.trackingNumber!,
              }
            : null,
        },
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/escrows/:escrowId/tracking`, async () =>
    HttpResponse.json({ success: true }, { status: 200 }),
  ),

  http.post(`${BASE_URL}/v1/escrows/:escrowId/complete`, async ({ params }) => {
    const escrowId = Number(params.escrowId);

    mockBuyerEscrows.forEach((item) => {
      if (item.escrowId === escrowId) {
        item.escrowStatus = 'COMPLETED';
      }
    });

    mockSellerEscrows.forEach((item) => {
      if (item.escrowId === escrowId) {
        item.escrowStatus = 'COMPLETED';
      }
    });

    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/escrows/:escrowId/cancel`, async () =>
    HttpResponse.json({ success: true }, { status: 200 }),
  ),
];
