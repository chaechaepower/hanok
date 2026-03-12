import { http, HttpResponse } from 'msw';
import { BASE_URL } from '@/api/instance';

import { getCurrentMockUser, setCurrentMockUser } from './mockState';

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

export const settingsHandlers = [
  // ─── Auth ────────────────────────────────────────────────────────────────────
  http.post(`${BASE_URL}/v1/auth/logout`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // ─── Settings – 구체적인 경로를 먼저 등록해야 /me 가 /me/* 요청을 가로채지 않음 ───

  // GET  /v1/users/me/seller-status
  http.get(`${BASE_URL}/v1/users/me/seller-status`, () => {
    return HttpResponse.json({ isSeller: false }, { status: 200 });
  }),

  // GET  /v1/users/me/notification
  http.get(`${BASE_URL}/v1/users/me/notification`, () => {
    return HttpResponse.json(mockNotification, { status: 200 });
  }),

  // PATCH /v1/users/me/notification
  http.patch(`${BASE_URL}/v1/users/me/notification`, async ({ request }) => {
    const body = (await request.json()) as { followStreamAlert: boolean };
    if (typeof body.followStreamAlert === 'boolean') {
      mockNotification.followStreamAlert = body.followStreamAlert;
    }
    return HttpResponse.json(mockNotification, { status: 200 });
  }),

  // GET  /v1/users/me
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

  // PATCH /v1/users/me/settings
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
      { userId: 1, email: mockMeData.email, phone: mockMeData.phone, updatedAt: new Date().toISOString() },
      { status: 200 },
    );
  }),

  // DELETE /v1/users/me/withdraw
  http.delete(`${BASE_URL}/v1/users/me/withdraw`, () => {
    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: '요청이 성공적으로 처리되었습니다.',
        data: { status: 'withdrawn' },
      },
      { status: 200 },
    );
  }),

  // GET /v1/following
  http.get(`${BASE_URL}/v1/following`, () => {
    const content = [
      {
        followId: 1,
        seller: { sellerId: 1, nickname: '신재혁상점', profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store1', rating: 4.8, isLive: true },
        followedAt: '2024-01-01T10:00:00Z',
      },
      {
        followId: 2,
        seller: { sellerId: 2, nickname: '빈티지마켓', profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store2', rating: 4.5, isLive: false },
        followedAt: '2024-01-05T09:00:00Z',
      },
      {
        followId: 3,
        seller: { sellerId: 3, nickname: '패션왕', profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store3', rating: 4.2, isLive: false },
        followedAt: '2024-01-10T14:00:00Z',
      },
      {
        followId: 4,
        seller: { sellerId: 4, nickname: '전자기기마트', profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store4', rating: 4.6, isLive: true },
        followedAt: '2024-01-12T08:30:00Z',
      },
      {
        followId: 5,
        seller: { sellerId: 5, nickname: '수집품갤러리', profileImageUri: 'https://api.dicebear.com/7.x/adventurer/svg?seed=store5', rating: 4.9, isLive: false },
        followedAt: '2024-01-15T11:00:00Z',
      },
    ];
    return HttpResponse.json(
      { content, page: 0, size: 20, totalElements: content.length, hasNext: false },
      { status: 200 },
    );
  }),

  // GET /v1/users/me/account
  http.get(`${BASE_URL}/v1/users/me/account`, () => {
    return HttpResponse.json(
      {
        bankName: '국민',
        accountNumber: '921381203',
      },
      { status: 200 }
    );
  }),

  // POST /v1/users/me/accounts
  http.post(`${BASE_URL}/v1/users/me/accounts`, async ({ request }) => {
    const body = await request.json() as { bankCode: string; bankName: string; accountNum: string; accountName: string };
    console.log('Mock: Account registered', body);
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // GET /v1/users/me/addresses
  http.get(`${BASE_URL}/v1/users/me/addresses`, () => {
    return HttpResponse.json(
      {
        addresses: [
          { id: 1, label: '집', isDefault: true, name: '이효은', zipCode: '43123', address: '경상북도 구미시 산동읍 첨단산업1로 17', phone: '010-****-5678' },
          { id: 2, label: '회사', isDefault: false, name: '이효은', zipCode: '12312', address: '서울특별시 강남구 테헤란로 123 3층', phone: '010-****-5678' },
        ],
      },
      { status: 200 },
    );
  }),

  // POST /v1/users/me/addresses
  http.post(`${BASE_URL}/v1/users/me/addresses`, () => {
    return HttpResponse.json({ message: '배송지가 추가되었습니다.' }, { status: 200 });
  }),

  // PATCH /v1/users/me/addresses/:id
  http.patch(`${BASE_URL}/v1/users/me/addresses/:id`, () => {
    return HttpResponse.json({ message: '배송지가 수정되었습니다.' }, { status: 200 });
  }),

  // DELETE /v1/users/me/addresses/:id
  http.delete(`${BASE_URL}/v1/users/me/addresses/:id`, () => {
    return HttpResponse.json({ message: '배송지가 삭제되었습니다.' }, { status: 200 });
  }),
];
