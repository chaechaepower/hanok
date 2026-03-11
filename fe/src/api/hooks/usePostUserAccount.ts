import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { RegisterAccountPayload, UserAccountResponse } from '@/types';

export const postUserAccountPath = () => `/v1/users/me/accounts`;

export const postUserAccount = async (payload: RegisterAccountPayload) => {
  const response = await getFetchInstance().post<UserAccountResponse>(
    postUserAccountPath(),
    payload,
  );
  return response.data;
};

export const usePostUserAccount = () => {
  return useMutation({
    mutationFn: (payload: RegisterAccountPayload) => postUserAccount(payload),
    throwOnError: false,
  });
};
