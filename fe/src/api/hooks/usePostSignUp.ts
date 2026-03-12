import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { SignUpPayload, ApiResponse, SignUpResponseData } from '@/types';

export const getSignUpPath = () => `/v1/auth/signup`;

export const signUp = async (payload: SignUpPayload) => {
  const response = await getFetchInstance().post<ApiResponse<SignUpResponseData>>(getSignUpPath(), payload);
  return response.data;
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: (payload: SignUpPayload) => signUp(payload),
    throwOnError: false,
  });
};
