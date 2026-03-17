import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

const mockWallet = {
  balance: 1250000,
  depositedAuctionBalance: 250000,
};

const mockPendingWalletCharges = new Map<string, number>();

// 계좌 없는 상태 테스트: 빈 값으로 설정
// 계좌 있는 상태 테스트: bankName, accountNumber를 채우세요
const mockAccount = {
  bankName: '신한은행',
  accountNum: '110-123-456789',
  accountName: '홍길동',
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

export const walletHandlers = [
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

  http.get(`${BASE_URL}/v1/trade-reports`, async ({ request }) => {
    const url = new URL(request.url);
    const type = (url.searchParams.get('type') ?? 'CHARGE').toUpperCase() as keyof typeof mockTradeReports;

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: mockTradeReports[type] ?? [],
    });
  }),
];
