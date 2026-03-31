import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import type { LoginPayload, SignUpPayload } from '@/types';

import { clearCurrentMockUser, mockLoginUsers, setCurrentMockUser } from './mockState';

const registeredEmails = mockLoginUsers.map((u) => u.email);

export const authHandlers = [
  http.get(`${BASE_URL}/v1/auth/check-email`, ({ request }) => {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') ?? '';

    const isDuplicated = registeredEmails.includes(email);
    if (isDuplicated) {
      return HttpResponse.json({ status: 'FAIL', message: '이미 사용 중인 이메일입니다.', data: {} }, { status: 400 });
    }
    return HttpResponse.json({ status: 'SUCCESS', message: '사용 가능한 이메일입니다.', data: {} });
  }),

  http.post(`${BASE_URL}/v1/auth/identity-verification`, async () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: '본인인증이 완료되었습니다.',
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

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '로그인 성공',
      data: {
        accessToken: matchedUser.accessToken,
        refreshToken: matchedUser.refreshToken,
      },
    });
  }),

  http.post(`${BASE_URL}/v1/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as SignUpPayload;

    registeredEmails.push(body.email);

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: '회원가입이 완료되었습니다.',
        data: {
          userId: Date.now(),
          email: body.email,
          nickname: body.nickname,
        },
      },
      { status: 201 },
    );
  }),

  http.post(`${BASE_URL}/v1/auth/logout`, async () => {
    clearCurrentMockUser();

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '로그아웃 성공',
      data: {},
    });
  }),
];
