import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { LoginPayload, LoginResponse } from '@/types';

export const getLoginPath = () => `/v1/auth/login`;

export const login = async (payload: LoginPayload) => {
  const response = await getFetchInstance().post<LoginResponse>(getLoginPath(), payload);
  return response.data;
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
  });
};
