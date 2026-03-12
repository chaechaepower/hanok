import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { LoginResponseData, ApiResponse } from '@/types';

export const getRefreshTokenPath = () => `/v1/auth/refresh`;

export const refreshToken = async () => {
  const currentRefreshToken = localStorage.getItem('refreshToken');
  const response = await getFetchInstance().post<ApiResponse<LoginResponseData>>(
    getRefreshTokenPath(),
    { refreshToken: currentRefreshToken },
  );

  const { accessToken, refreshToken: newRefreshToken } = response.data.data;
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken);
  }

  return response.data;
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: () => refreshToken(),
  });
};
