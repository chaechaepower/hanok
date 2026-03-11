import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import type { LoginPayload, LoginResponse } from '@/types';

import { clearCurrentMockUser, mockLoginUsers, setCurrentMockUser } from './mockState';

export const authHandlers = [
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

  http.post(`${BASE_URL}/v1/auth/logout`, async () => {
    clearCurrentMockUser();

    return HttpResponse.json({
      success: true,
    });
  }),
];
