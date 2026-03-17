import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import LogoImage from '@/assets/Logo.png';

import {
  getMockFollowerCount,
  incrementMockFollowerCount,
  decrementMockFollowerCount,
  isSellerFollowed,
  followSeller,
  unfollowSeller,
} from './mockState';

type MockNoticeItem = {
  noticeId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

let mockNoticeItems: MockNoticeItem[] = [
  {
    noticeId: 5,
    title: 'This week shipping notice',
    content: 'Orders placed this week will start shipping in three days.',
    createdAt: '2026-03-03T12:00:00Z',
    updatedAt: '2026-03-03T12:00:00Z',
  },
  {
    noticeId: 6,
    title: 'Weekend live schedule',
    content: 'The weekend live auction starts at 8 PM and featured lots open first.',
    createdAt: '2026-03-02T09:00:00Z',
    updatedAt: '2026-03-02T09:00:00Z',
  },
];

export const profileHandlers = [
  http.patch(`${BASE_URL}/v1/sellers/:sellerId/profile`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    console.log('Mock: seller profile updated', body);

    return HttpResponse.json(
      { status: 'SUCCESS', message: 'Seller profile updated successfully.', data: {} },
      { status: 200 },
    );
  }),

  http.get(`${BASE_URL}/v1/sellers/:sellerId/sold-auctions`, () => {
    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Sold auctions fetched successfully.',
        data: [
          {
            image: 'https://picsum.photos/seed/sold-camera/400/300',
            itemName: 'Vintage Camera',
            amount: 250000,
            escrowStatus: 'DEPOSITED',
            createdAt: '2026-03-05T08:15:30Z',
          },
          {
            image: 'https://picsum.photos/seed/sold-console/400/300',
            itemName: 'Retro Game Console',
            amount: 180000,
            escrowStatus: 'INVOICE_SUBMITTED',
            createdAt: '2026-03-05T09:20:15Z',
          },
          {
            image: 'https://picsum.photos/seed/sold-sneakers/400/300',
            itemName: 'Limited Sneakers',
            amount: 320000,
            escrowStatus: 'COMPLETED',
            createdAt: '2026-03-05T10:45:50Z',
          },
        ],
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/users/:userId/follow`, async ({ params }) => {
    const userId = Number(params.userId);
    const wasFollowing = isSellerFollowed(userId);

    if (wasFollowing) {
      unfollowSeller(userId);
      return HttpResponse.json({
        status: 'SUCCESS',
        message: 'Unfollowed successfully.',
        data: {
          following: false,
          followerCount: decrementMockFollowerCount(),
          followingCount: 11,
        },
      });
    }

    followSeller(userId);
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Followed successfully.',
      data: {
        following: true,
        followerCount: incrementMockFollowerCount(),
        followingCount: 12,
      },
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
          nickname: 'Luxury Seller',
          intro: 'Authentic luxury goods only. Feel free to ask questions anytime.',
          profileImage: LogoImage,
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
              title: 'Luxury Leather Bag',
              finalPrice: 8500000,
              soldAt: '2026-03-09T14:00:00Z',
            },
          ],
          posts: [
            {
              streamId: 10,
              title: 'Weekly luxury live auction',
              category: 'LUXURY_GOODS',
              thumbnail: LogoImage,
              scheduledAt: '2026-03-08T20:00:00Z',
              state: 'SCHEDULED',
            },
          ],
        },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      {
        sellerId,
        nickname: 'Seller Mock',
        intro: 'Curating good items and running regular live auctions.',
        profileImage: LogoImage,
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
            title: 'Rare Air Max',
            finalPrice: 75000,
            soldAt: '2026-03-01T14:00:00Z',
          },
        ],
        posts: [
          {
            streamId: 5,
            title: 'This week live preview',
            category: 'SNEAKERS_SHOES',
            thumbnail: LogoImage,
            scheduledAt: '2026-03-03T20:00:00Z',
            state: 'LIVE',
          },
        ],
      },
      { status: 200 },
    );
  }),

  http.get(`${BASE_URL}/v1/sellers/:sellerId/notices`, () => {
    return HttpResponse.json(mockNoticeItems, { status: 200 });
  }),

  http.get(`${BASE_URL}/v1/sellers/:sellerId/notices/:noticeId`, ({ params }) => {
    const noticeId = Number(params.noticeId);
    const notice = mockNoticeItems.find((item) => item.noticeId === noticeId);

    if (!notice) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '공지사항을 찾을 수 없음' }, { status: 404 });
    }

    return HttpResponse.json(notice, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/sellers/:sellerId/notices`, async ({ request }) => {
    const body = (await request.json()) as { title: string; content: string };
    const newNotice: MockNoticeItem = {
      noticeId: Date.now(),
      title: body.title,
      content: body.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockNoticeItems = [newNotice, ...mockNoticeItems];

    return HttpResponse.json(
      {
        noticeId: newNotice.noticeId,
        title: newNotice.title,
        content: newNotice.content,
        createdAt: newNotice.createdAt,
      },
      { status: 200 },
    );
  }),

  http.patch(`${BASE_URL}/v1/sellers/:sellerId/notices/:noticeId`, async ({ request, params }) => {
    const noticeId = Number(params.noticeId);
    const body = (await request.json()) as { title: string; content: string };

    mockNoticeItems = mockNoticeItems.map((item) =>
      item.noticeId === noticeId
        ? {
            ...item,
            title: body.title,
            content: body.content,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    const updatedNotice = mockNoticeItems.find((item) => item.noticeId === noticeId);

    return HttpResponse.json(
      {
        noticeId,
        title: updatedNotice?.title ?? body.title,
        content: updatedNotice?.content ?? body.content,
        updatedAt: updatedNotice?.updatedAt ?? new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.delete(`${BASE_URL}/v1/sellers/:sellerId/notices/:noticeId`, ({ params }) => {
    const noticeId = Number(params.noticeId);
    mockNoticeItems = mockNoticeItems.filter((item) => item.noticeId !== noticeId);

    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
