import { useMutation } from '@tanstack/react-query';

import { clearAuthSession, getFetchInstance } from '../instance';
import type { ApiResponse } from '@/types';

export const getLogoutPath = () => `/v1/auth/logout`;

export const logout = async () => {
  const response = await getFetchInstance().post<ApiResponse>(getLogoutPath());
  clearAuthSession({ redirectToLogin: false });
  return response.data;
};

export const useLogout = () => {
  return useMutation({
    mutationFn: () => logout(),
  });
};
