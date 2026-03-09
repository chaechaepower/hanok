import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { RefreshTokenPayload, RefreshTokenResponse } from '@/types';

export const getRefreshTokenPath = () => `/v1/auth/refresh`;

export const refreshToken = async (payload: RefreshTokenPayload) => {
  const response = await getFetchInstance().post<RefreshTokenResponse>(
    getRefreshTokenPath(),
    payload,
  );
  return response.data;
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: (payload: RefreshTokenPayload) => refreshToken(payload),
  });
};
