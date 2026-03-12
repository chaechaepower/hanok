import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { LoginPayload, LoginResponseData, ApiResponse } from '@/types';

export const getLoginPath = () => `/v1/auth/login`;

export const login = async (payload: LoginPayload) => {
  const response = await getFetchInstance().post<ApiResponse<LoginResponseData>>(getLoginPath(), payload);

  const { accessToken, refreshToken } = response.data.data;
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  return response.data;
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
  });
};
