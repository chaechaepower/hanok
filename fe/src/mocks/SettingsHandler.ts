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
  bankCode: '088',
  accountName: 'Hong Gil Dong',
  accountNum: '110-123-456789',
  sellerId: 1 as number | null,
};

const mockAccountData = {
  bankCode: '088',
  bankName: 'Shinhan Bank',
  accountNum: '110-123-456789',
  accountName: 'Hong Gil Dong',
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

  http.get(`${BASE_URL}/v1/users/me/seller-status`, () =>
    HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Seller status fetched successfully.',
        data: {
          isSeller: false,
          sellerId: null,
        },
      },
      { status: 200 },
    ),
  ),

  http.get(`${BASE_URL}/v1/users/me/notification`, () =>
    HttpResponse.json(mockNotification, { status: 200 }),
  ),

  http.patch(`${BASE_URL}/v1/users/me/notification`, async ({ request }) => {
    const body = (await request.json()) as { followStreamAlert: boolean };

    if (typeof body.followStreamAlert === 'boolean') {
      mockNotification.followStreamAlert = body.followStreamAlert;
    }

    return HttpResponse.json(mockNotification, { status: 200 });
  }),

  http.get(`${BASE_URL}/v1/users/me`, () => {
    const currentUser = getCurrentMockUser();
    const data = currentUser
      ? {
          email: currentUser.email,
          nickname: currentUser.nickname,
          profileImage: currentUser.profileImage,
          phone: currentUser.phone,
          balance: currentUser.balance,
          depositedBalance: currentUser.depositedBalance,
          bankCode: mockMeData.bankCode,
          accountName: mockMeData.accountName,
          accountNum: mockMeData.accountNum,
          sellerId: mockMeData.sellerId,
        }
      : mockMeData;

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'User info fetched successfully.',
        data,
      },
      { status: 200 },
    );
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

  http.get(`${BASE_URL}/v1/users/me/account`, () =>
    HttpResponse.json(
      {
        bankName: mockAccountData.bankName,
        accountNum: mockAccountData.accountNum,
        accountName: mockAccountData.accountName,
      },
      { status: 200 },
    ),
  ),

  http.patch(`${BASE_URL}/v1/users/me/account`, async ({ request }) => {
    const body = (await request.json()) as {
      bankCode: string;
      accountNum: string;
      accountName: string;
    };

    mockMeData.bankCode = body.bankCode;
    mockMeData.accountNum = body.accountNum;
    mockMeData.accountName = body.accountName;
    mockAccountData.bankCode = body.bankCode;
    mockAccountData.accountNum = body.accountNum;
    mockAccountData.accountName = body.accountName;

    return HttpResponse.json(
      {
        bankName: mockAccountData.bankName,
        accountNum: mockAccountData.accountNum,
        accountName: mockAccountData.accountName,
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
          address: 'Seoul Gangnam-daero 17',
          addressDetail: '101-1001',
          phone: '010-0000-5678',
          recipientName: 'Mock User',
          isDefault: true,
        },
        {
          id: 2,
          addressName: 'Office',
          postalCode: 12312,
          address: 'Seoul Teheran-ro 123',
          addressDetail: '5F',
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

  http.patch(`${BASE_URL}/v1/users/me/password`, async () =>
    HttpResponse.json(
      { status: 'SUCCESS', message: 'Password updated successfully.', data: {} },
      { status: 200 },
    ),
  ),

  http.patch(`${BASE_URL}/v1/users/me/profile-image`, async () =>
    HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Profile image updated successfully.',
        data: 'https://api.dicebear.com/7.x/adventurer/svg?seed=updated',
      },
      { status: 200 },
    ),
  ),
];
