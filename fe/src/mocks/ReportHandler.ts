import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

export const reportHandlers = [
  http.get(`${BASE_URL}/v1/sellers/:sellerId/report`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청에 성공했습니다.',
      data: {
        totalSalesAmount: 14500000,
        totalSettlementAmount: 12000000,
        escrowSummary: {
          pendingSettlementAmount: 2500000,
          completedSettlementAmount: 12000000,
        },
        trendGraph: {
          currentMonthTotal: 14500000,
          lastMonthTotal: 10000000,
          growthRate: 25.0,
          dailySales: [
            { date: '2026-03-01', amount: 500000 },
            { date: '2026-03-02', amount: 800000 },
            { date: '2026-03-03', amount: 1200000 },
            { date: '2026-03-04', amount: 300000 },
            { date: '2026-03-05', amount: 950000 },
            { date: '2026-03-06', amount: 0 },
            { date: '2026-03-07', amount: 1100000 },
            { date: '2026-03-08', amount: 1500000 },
            { date: '2026-03-09', amount: 600000 },
            { date: '2026-03-10', amount: 2200000 },
            { date: '2026-03-11', amount: 750000 },
            { date: '2026-03-12', amount: 400000 },
            { date: '2026-03-13', amount: 1800000 },
            { date: '2026-03-14', amount: 0 },
            { date: '2026-03-15', amount: 900000 },
            { date: '2026-03-16', amount: 1300000 },
            { date: '2026-03-17', amount: 0 },
            { date: '2026-03-18', amount: 1500000 },
            { date: '2026-03-19', amount: 3000000 },
            { date: '2026-03-20', amount: 0 },
          ],
        },
        topHotItems: [
          {
            itemId: 105,
            itemName: '나이키 한정판 조던 스니커즈',
            imageUrl: 'https://picsum.photos/seed/jordan/200/200',
            bidCount: 42,
            finalPrice: 450000,
          },
          {
            itemId: 211,
            itemName: '미개봉 아이패드 프로 6세대',
            imageUrl: 'https://picsum.photos/seed/ipad/200/200',
            bidCount: 38,
            finalPrice: 1200000,
          },
          {
            itemId: 312,
            itemName: '빈티지 롤렉스 서브마리너',
            imageUrl: 'https://picsum.photos/seed/rolex/200/200',
            bidCount: 35,
            finalPrice: 8500000,
          },
        ],
        auctionStats: {
          totalAuctions: 100,
          successfulBids: 85,
          failedBids: 15,
        },
        transactionStats: {
          completedTrades: 80,
          cancelledTrades: 5,
          completionRate: 94.1,
        },
        categoryStats: [
          { category: 'ELECTRONICS', salesCount: 45, salesAmount: 10000000 },
          { category: 'CLOTHING', salesCount: 35, salesAmount: 2000000 },
          { category: 'SNEAKERS_SHOES', salesCount: 15, salesAmount: 1500000 },
          { category: 'WATCHES', salesCount: 5, salesAmount: 1000000 },
        ],
        reputation: {
          rating: 4.8,
          avgShipDays: 1.5,
          penaltyCount: 0,
        },
      },
    });
  }),
];
