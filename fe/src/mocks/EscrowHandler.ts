import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

const mockEscrows = [
  {
    escrowId: 100,
    imageUrl: 'https://picsum.photos/seed/camera/140/140',
    itemName: '빈티지 카메라',
    amount: 250000,
    escrowState: 'DEPOSITED',
    createdAt: '2026-03-15T08:15:30Z',
  },
  {
    escrowId: 101,
    imageUrl: 'https://picsum.photos/seed/shoes/140/140',
    itemName: 'Vintage sneakers',
    amount: 75000,
    escrowState: 'INVOICE_SUBMITTED',
    createdAt: '2026-03-01T23:00:00Z',
  },
  {
    escrowId: 102,
    imageUrl: 'https://picsum.photos/seed/jacket/140/140',
    itemName: 'Collector jacket',
    amount: 120000,
    escrowState: 'COMPLETED',
    createdAt: '2026-02-20T19:30:00Z',
  },
];

export const escrowHandlers = [
  http.get(`${BASE_URL}/v1/escrows`, () => {
    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Escrow list fetched successfully.',
        data: mockEscrows,
      },
      { status: 200 },
    );
  }),

  http.get(`${BASE_URL}/v1/escrows/:escrowId`, ({ params }) => {
    const escrowId = String(params.escrowId);

    const detailMap: Record<string, { imageUrl: string; itemName: string; finalPrice: number; wonAt: string; courierName?: string; trackingNumber?: string }> = {
      '100': { imageUrl: 'https://picsum.photos/seed/camera/140/140', itemName: '빈티지 카메라', finalPrice: 250000, wonAt: '2026-03-15T08:15:30Z' },
      '101': { imageUrl: 'https://picsum.photos/seed/shoes/140/140', itemName: 'Vintage sneakers', finalPrice: 75000, wonAt: '2026-03-01T23:00:00Z', courierName: '한진택배', trackingNumber: '580123456789' },
      '102': { imageUrl: 'https://picsum.photos/seed/jacket/140/140', itemName: 'Collector jacket', finalPrice: 120000, wonAt: '2026-02-20T19:30:00Z', courierName: 'CJ Logistics', trackingNumber: '120312319124' },
    };

    const detail = detailMap[escrowId] ?? detailMap['100'];

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Escrow detail fetched successfully.',
        data: {
          winningInfo: {
            imageUrl: detail.imageUrl,
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
            ? { courierName: detail.courierName, trackingNumber: detail.trackingNumber! }
            : null,
        },
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/escrows/:escrowId/tracking`, async () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/escrows/:escrowId/cancel`, async () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
