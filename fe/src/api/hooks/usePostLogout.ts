import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { LogoutPayload, LogoutResponse } from '@/types';

export const getLogoutPath = () => `/v1/auth/logout`;

export const logout = async (payload: LogoutPayload) => {
  const response = await getFetchInstance().post<LogoutResponse>(getLogoutPath(), payload);
  return response.data;
};

export const useLogout = () => {
  return useMutation({
    mutationFn: (payload: LogoutPayload) => logout(payload),
  });
};
