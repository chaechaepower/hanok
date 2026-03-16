import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

import { getCurrentMockUser, getFollowedSellerIds, setCurrentMockUser } from './mockState';

const mockMeData = {
  email: 'user@example.com',
  nickname: 'rerak',
  profileImage: 'https://api.dicebear.com/7.x/adventurer/svg?seed=rerak',
  phone: '01012345678',
  balance: 10000,
  depositedBalance: 5000,
};

const mockNotification = {
  followStreamAlert: true,
};

const FOLLOWED_SELLER_CATALOG = [
  {
    sellerId: 1,
    nickname: 'store_one',
    profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store1',
    rating: 4.8,
    isLive: true,
  },
  {
    sellerId: 2,
    nickname: 'luxury_lab',
    profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store2',
    rating: 4.5,
    isLive: false,
  },
  {
    sellerId: 3,
    nickname: 'card_room',
    profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store3',
    rating: 4.2,
    isLive: false,
  },
  {
    sellerId: 4,
    nickname: 'tech_house',
    profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store4',
    rating: 4.6,
    isLive: true,
  },
  {
    sellerId: 5,
    nickname: 'vintage_zone',
    profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store5',
    rating: 4.9,
    isLive: false,
  },
  {
    sellerId: 10,
    nickname: 'vintage_hub',
    profileImageUri: 'https://picsum.photos/seed/seller-10/120/120',
    rating: 4.7,
    isLive: true,
  },
  {
    sellerId: 12,
    nickname: 'sneaker_room',
    profileImageUri: 'https://picsum.photos/seed/seller-12/120/120',
    rating: 4.9,
    isLive: true,
  },
  {
    sellerId: 14,
    nickname: 'card_deck',
    profileImageUri: 'https://picsum.photos/seed/seller-14/120/120',
    rating: 4.4,
    isLive: true,
  },
];

export const settingsHandlers = [
  http.post(`${BASE_URL}/v1/auth/logout`, () => HttpResponse.json({ success: true }, { status: 200 })),

  http.get(`${BASE_URL}/v1/users/me/seller-status`, () => HttpResponse.json({ isSeller: false }, { status: 200 })),

  http.get(`${BASE_URL}/v1/users/me/notification`, () => HttpResponse.json(mockNotification, { status: 200 })),

  http.patch(`${BASE_URL}/v1/users/me/notification`, async ({ request }) => {
    const body = (await request.json()) as { followStreamAlert: boolean };

    if (typeof body.followStreamAlert === 'boolean') {
      mockNotification.followStreamAlert = body.followStreamAlert;
    }

    return HttpResponse.json(mockNotification, { status: 200 });
  }),

  http.get(`${BASE_URL}/v1/users/me`, () => {
    const currentUser = getCurrentMockUser();

    if (currentUser) {
      return HttpResponse.json(
        {
          email: currentUser.email,
          nickname: currentUser.nickname,
          profileImage: currentUser.profileImage,
          phone: currentUser.phone,
          balance: currentUser.balance,
          depositedBalance: currentUser.depositedBalance,
        },
        { status: 200 },
      );
    }

    return HttpResponse.json(mockMeData, { status: 200 });
  }),

  http.patch(`${BASE_URL}/v1/users/me/settings`, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      phone?: string;
      nickname?: string;
      profileImage?: string;
    };

    if (body.email) mockMeData.email = body.email;
    if (body.phone) mockMeData.phone = body.phone;
    if (body.nickname) mockMeData.nickname = body.nickname;
    if (body.profileImage) mockMeData.profileImage = body.profileImage;

    const currentUser = getCurrentMockUser();
    if (currentUser) {
      setCurrentMockUser({
        ...currentUser,
        email: body.email ?? currentUser.email,
        phone: body.phone ?? currentUser.phone,
        nickname: body.nickname ?? currentUser.nickname,
        profileImage: body.profileImage ?? currentUser.profileImage,
      });
    }

    return HttpResponse.json(
      {
        userId: currentUser?.userId ?? 1,
        email: mockMeData.email,
        phone: mockMeData.phone,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.delete(`${BASE_URL}/v1/users/me/withdraw`, () =>
    HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'User withdrawn successfully.',
        data: { status: 'withdrawn' },
      },
      { status: 200 },
    ),
  ),

  http.get(`${BASE_URL}/v1/following`, () => {
    const content = getFollowedSellerIds()
      .map((sellerId, index) => {
        const seller = FOLLOWED_SELLER_CATALOG.find((item) => item.sellerId === sellerId);

        if (!seller) {
          return null;
        }

        return {
          followId: index + 1,
          seller,
          followedAt: new Date(Date.now() - index * 86400000).toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return HttpResponse.json(
      { content, page: 0, size: 20, totalElements: content.length, hasNext: false },
      { status: 200 },
    );
  }),

  // GET /v1/users/me/account
  // 계좌 없는 상태로 테스트: bankName, accountNum, accountName을 빈 값으로 설정
  // 계좌 있는 상태로 테스트하려면 아래 값을 채우세요
  http.get(`${BASE_URL}/v1/users/me/account`, () => {
    return HttpResponse.json(
      {
        bankName: '신한은행',
        accountNum: '110-123-456789',
        accountName: '홍길동',
      },
      { status: 200 },
    );
  }),

  http.patch(`${BASE_URL}/v1/users/me/account`, async ({ request }) => {
    const body = (await request.json()) as {
      bankCode: string;
      accountNum: string;
      accountName: string;
    };

    console.log('Mock: account registered', body);
    return HttpResponse.json(
      {
        bankName: '신한은행',
        accountNum: body.accountNum,
        accountName: body.accountName,
      },
      { status: 200 },
    );
  }),

  http.get(`${BASE_URL}/v1/users/me/addresses`, () =>
    HttpResponse.json(
      [
        {
          id: 1,
          addressName: 'Home',
          postalCode: 43123,
          address: '서울특별시 강남구 테헤란로 17',
          addressDetail: '101동 1001호',
          phone: '010-0000-5678',
          recipientName: 'Mock User',
          isDefault: true,
        },
        {
          id: 2,
          addressName: 'Office',
          postalCode: 12312,
          address: '서울특별시 서초구 서초대로 123',
          addressDetail: '5층',
          phone: '010-0000-5678',
          recipientName: 'Mock User',
          isDefault: false,
        },
      ],
      { status: 200 },
    ),
  ),

  http.post(`${BASE_URL}/v1/users/me/addresses`, () =>
    HttpResponse.json({ message: 'Address added successfully.' }, { status: 200 }),
  ),

  http.patch(`${BASE_URL}/v1/users/me/addresses/:id`, () =>
    HttpResponse.json({ message: 'Address updated successfully.' }, { status: 200 }),
  ),

  http.delete(`${BASE_URL}/v1/users/me/addresses/:id`, () =>
    HttpResponse.json({ message: 'Address deleted successfully.' }, { status: 200 }),
  ),

  http.patch(`${BASE_URL}/v1/users/me/password`, async () => {
    return HttpResponse.json(
      { status: 'SUCCESS', message: '비밀번호가 변경되었습니다.', data: {} },
      { status: 200 },
    );
  }),

  http.patch(`${BASE_URL}/v1/users/me/profile-image`, async () => {
    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: '프로필 이미지가 업로드되었습니다.',
        data: 'https://api.dicebear.com/7.x/adventurer/svg?seed=updated',
      },
      { status: 200 },
    );
  }),
];
