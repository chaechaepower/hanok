import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import type { LoginPayload, LoginResponse, IdentityVerificationResponse, CheckEmailResponse, SignUpPayload } from '@/types';

import { clearCurrentMockUser, mockLoginUsers, setCurrentMockUser } from './mockState';

const registeredEmails = mockLoginUsers.map((u) => u.email);

export const authHandlers = [
  http.get(`${BASE_URL}/v1/auth/check-email`, ({ request }) => {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') ?? '';
    console.log('[Mock] 이메일 중복 확인:', email);

    const isDuplicated = registeredEmails.includes(email);
    return HttpResponse.json<CheckEmailResponse>({ isDuplicated });
  }),

  http.post(`${BASE_URL}/v1/auth/identity-verification`, async ({ request }) => {
    const { identityVerificationId } = (await request.json()) as { identityVerificationId: string };
    console.log('[Mock] 본인인증 요청:', identityVerificationId);

    return HttpResponse.json<IdentityVerificationResponse>({
      status: 'SUCCESS',
      data: {
        name: '홍길동',
        phoneNumber: '01012345678',
        birthDate: '1990-01-01',
      },
    });
  }),

  http.post(`${BASE_URL}/v1/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as LoginPayload;
    const matchedUser = mockLoginUsers.find((user) => user.email === email && user.password === password);

    if (!matchedUser) {
      return HttpResponse.json(
        {
          message: 'Invalid email or password',
        },
        { status: 401 },
      );
    }

    setCurrentMockUser({ ...matchedUser });

    return HttpResponse.json<LoginResponse>({
      accessToken: matchedUser.accessToken,
      refreshToken: matchedUser.refreshToken,
      user: {
        userId: matchedUser.userId,
        email: matchedUser.email,
        phone: matchedUser.phone,
      },
    });
  }),

  http.post(`${BASE_URL}/v1/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as SignUpPayload;
    console.log('[Mock] 회원가입 요청:', body.email, body.nickname);

    registeredEmails.push(body.email);

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '회원가입이 완료되었습니다.',
      data: {
        userId: Date.now(),
        email: body.email,
        nickname: body.nickname,
      },
    }, { status: 201 });
  }),

  http.post(`${BASE_URL}/v1/auth/logout`, async () => {
    clearCurrentMockUser();

    return HttpResponse.json({
      success: true,
    });
  }),
];
