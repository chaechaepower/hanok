import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

type MockWithdraw = {
  id: number;
  userId: number;
  accountName: string;
  bankCode: string;
  accountNum: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  processedAt: string | null;
};

const mockWithdraws: MockWithdraw[] = [
  {
    id: 101,
    userId: 12,
    accountName: '김철수',
    amount: 50000,
    bankCode: '004',
    accountNum: '123-456-789012',
    status: 'PENDING',
    requestedAt: '2026-03-21T14:30:00',
    processedAt: null,
  },
  {
    id: 102,
    userId: 15,
    accountName: '이영희',
    amount: 120000,
    bankCode: '088',
    accountNum: '987654321000',
    status: 'COMPLETED',
    requestedAt: '2026-03-20T09:15:00',
    processedAt: '2026-03-20T10:05:00',
  },
  {
    id: 103,
    userId: 21,
    accountName: '박민수',
    amount: 200000,
    bankCode: '088',
    accountNum: '110123456789',
    status: 'REJECTED',
    requestedAt: '2026-03-19T11:45:00',
    processedAt: '2026-03-19T13:10:00',
  },
  {
    id: 104,
    userId: 28,
    accountName: '최유진',
    amount: 80000,
    bankCode: '004',
    accountNum: '222-333-444555',
    status: 'PENDING',
    requestedAt: '2026-03-21T08:10:00',
    processedAt: null,
  },
];

export const adminHandlers = [
  http.get(`${BASE_URL}/v1/admin/withdraws`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const filtered = status
      ? mockWithdraws.filter((w) => w.status === status)
      : mockWithdraws;

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '조회 성공',
      data: filtered,
    });
  }),

  http.post(`${BASE_URL}/v1/admin/withdraws/:withdrawId/complete`, ({ params }) => {
    const withdrawId = Number(params.withdrawId);
    const withdraw = mockWithdraws.find((w) => w.id === withdrawId);

    if (!withdraw) {
      return HttpResponse.json(
        { status: 'FAIL', message: '출금 요청 없음' },
        { status: 404 },
      );
    }

    withdraw.status = 'COMPLETED';
    withdraw.processedAt = new Date().toISOString();

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '출금 완료 처리 성공',
      data: {},
    });
  }),
];
