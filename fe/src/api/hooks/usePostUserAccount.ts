import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, RegisterAccountPayload, UserAccountResponse } from '@/types';

export const patchUserAccountPath = () => `/v1/users/me/account`;

export const patchUserAccount = async (payload: RegisterAccountPayload) => {
  const response = await getFetchInstance().patch<ApiResponse<UserAccountResponse>>(
    patchUserAccountPath(),
    payload,
  );
  return response.data;
};

export const usePostUserAccount = () => {
  return useMutation({
    mutationFn: (payload: RegisterAccountPayload) => patchUserAccount(payload),
    throwOnError: false,
  });
};
