import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';

export type SignUpPayload = {
  email: string;
  nickname: string;
  password: string;
  phone: string;
  smsToken: string;
};

export const getSignUpPath = () => `/v1/auth/signup`;

export const signUp = async (payload: SignUpPayload) => {
  const response = await getFetchInstance().post(getSignUpPath(), payload);
  return response.data;
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: (payload: SignUpPayload) => signUp(payload),
  });
};
