import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { PostUserAccountPayload, PostUserAccountResponse } from '@/types';

export const postUserAccountPath = () => `/v1/users/me/accounts`;

export const postUserAccount = async (payload: PostUserAccountPayload) => {
  const response = await getFetchInstance().post<PostUserAccountResponse>(
    postUserAccountPath(),
    payload,
  );
  return response.data;
};

export const usePostUserAccount = () => {
  return useMutation({
    mutationFn: (payload: PostUserAccountPayload) => postUserAccount(payload),
    throwOnError: false,
  });
};
