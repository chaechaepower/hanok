import { useMutation } from '@tanstack/react-query';

import { refreshSessionTokens } from '../instance';

export const getRefreshTokenPath = () => `/v1/auth/refresh`;

export const refreshToken = async () => {
  return refreshSessionTokens();
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: () => refreshToken(),
  });
};
