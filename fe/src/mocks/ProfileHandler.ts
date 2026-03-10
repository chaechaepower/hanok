import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import LogoImage from '@/assets/Logo.png';

import { decrementMockFollowerCount, getMockFollowerCount, incrementMockFollowerCount } from './mockState';

type MockNoticeItem = {
  postId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

let mockNoticeItems: MockNoticeItem[] = [
  {
    postId: 5,
    title: 'This week shipping notice',
    content: 'Orders placed this week will start shipping in three days.',
    createdAt: '2026-03-03T12:00:00Z',
    updatedAt: '2026-03-03T12:00:00Z',
  },
  {
    postId: 6,
    title: 'Weekend live schedule',
    content: 'The weekend live auction starts at 8 PM and featured lots open first.',
    createdAt: '2026-03-02T09:00:00Z',
    updatedAt: '2026-03-02T09:00:00Z',
  },
];

export const profileHandlers = [
  http.patch(`${BASE_URL}/v1/users/:userId/follow`, async () => {
    return HttpResponse.json({
      following: true,
      followerCount: incrementMockFollowerCount(),
      followingCount: 12,
    });
  }),

  http.delete(`${BASE_URL}/v1/users/:userId/unfollow`, async () => {
    return HttpResponse.json({
      following: false,
      followerCount: decrementMockFollowerCount(),
      followingCount: 11,
    });
  }),

  http.get(`${BASE_URL}/v1/sellers/:sellerId/reputation`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Seller reputation fetched successfully.',
      data: {
        followerCount: getMockFollowerCount(),
        totalTrades: 50,
        completionRate: 98.5,
        cancelCount: 1,
        avgShipDays: 2.3,
      },
    });
  }),

  http.get(`${BASE_URL}/v1/sellers/:sellerId/profile`, ({ params }) => {
    const sellerId = Number(params.sellerId);

    if (sellerId === 200) {
      return HttpResponse.json(
        {
          sellerId: 200,
          nickname: '명품셀러',
          intro: '정품만 취급합니다. 문의 환영합니다.',
          profile_image: LogoImage,
          instagramUrl: 'https://instagram.com/luxury_seller',
          youtubeUrl: 'https://youtube.com/@luxury_seller_tv',
          tiktokUrl: 'https://tiktok.com/@luxury_seller_official',
          stats: {
            rating: 4.9,
            avgShipDays: 1.2,
            followerCount: 1542,
          },
          recentSales: [
            {
              itemId: 101,
              title: '샤넬 클래식 플랩백',
              finalPrice: 8500000,
              soldAt: '2026-03-09T14:00:00Z',
            },
          ],
          posts: [
            {
              postId: 10,
              title: '이번 주 신상 입고 안내',
              context: '이번 주말에 에르메스 물량 풀립니다.',
              createdAt: '2026-03-08T12:00:00Z',
            },
          ],
        },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      {
        sellerId,
        nickname: '판매왕',
        intro: '좋은 물건만 팔아요',
        profile_image: LogoImage,
        instagramUrl: 'https://instagram.com/im_rerak',
        youtubeUrl: 'https://youtube.com/@im_rerak',
        tiktokUrl: 'https://tiktok.com/@seller123',
        stats: {
          rating: 4.7,
          avgShipDays: 1.8,
          followerCount: 342,
        },
        recentSales: [
          {
            itemId: 10,
            title: '나이키 에어맥스',
            finalPrice: 75000,
            soldAt: '2026-03-01T14:00:00Z',
          },
        ],
        posts: [
          {
            postId: 5,
            title: '이번 주 방송 예고',
            context: '방송 이번주에 해요',
            createdAt: '2026-03-03T12:00:00Z',
          },
        ],
      },
      { status: 200 },
    );
  }),

  http.get(`${BASE_URL}/v1/sellers/:sellerId/notice`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const start = (page - 1) * limit;
    const end = page * limit;

    return HttpResponse.json(
      {
        items: mockNoticeItems.slice(start, end),
        total: mockNoticeItems.length,
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/sellers/:sellerId/posts`, async ({ request }) => {
    const body = (await request.json()) as { title: string; content: string };
    const newNotice: MockNoticeItem = {
      postId: Date.now(),
      title: body.title,
      content: body.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockNoticeItems = [newNotice, ...mockNoticeItems];

    return HttpResponse.json(
      {
        postId: newNotice.postId,
        title: newNotice.title,
        content: newNotice.content,
        createdAt: newNotice.createdAt,
      },
      { status: 200 },
    );
  }),

  http.patch(`${BASE_URL}/v1/sellers/:sellerId/posts/:postId`, async ({ request, params }) => {
    const postId = Number(params.postId);
    const body = (await request.json()) as { title: string; content: string };

    mockNoticeItems = mockNoticeItems.map((item) =>
      item.postId === postId
        ? {
            ...item,
            title: body.title,
            content: body.content,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    const updatedNotice = mockNoticeItems.find((item) => item.postId === postId);

    return HttpResponse.json(
      {
        postId,
        title: updatedNotice?.title ?? body.title,
        content: updatedNotice?.content ?? body.content,
        updatedAt: updatedNotice?.updatedAt ?? new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.delete(`${BASE_URL}/v1/sellers/:sellerId/posts/:postId`, ({ params }) => {
    const postId = Number(params.postId);
    mockNoticeItems = mockNoticeItems.filter((item) => item.postId !== postId);

    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
