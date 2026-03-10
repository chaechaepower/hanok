import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

const mockEscrows = [
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
    const isCompleted = escrowId === '102';

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Escrow detail fetched successfully.',
        data: {
          winningInfo: {
            imageUrl: isCompleted
              ? 'https://picsum.photos/seed/jacket/140/140'
              : 'https://picsum.photos/seed/candle/140/140',
            itemName: isCompleted ? 'Collector jacket' : 'Vintage candle holder',
            finalPrice: isCompleted ? 120000 : 2300,
            sellerName: 'Mock Seller',
            sellerId: 'seller_1',
            wonAt: isCompleted ? '2026-02-20T19:30:00Z' : '2026-03-01T10:24:00Z',
          },
          shippingAddress: {
            name: 'Mock User',
            phone: '010-3134-6396',
            postalCode: '03154',
            address: '123 Mock Street',
            addressDetail: '405-107',
          },
          delivery: isCompleted
            ? {
                courierName: 'CJ Logistics',
                trackingNumber: '120312319124',
              }
            : null,
        },
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/escrows/:escrowId/invoice`, async () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/escrows/:escrowId/cancel`, async () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
