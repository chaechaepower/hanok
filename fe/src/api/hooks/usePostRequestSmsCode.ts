import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';

export const getRequestSmsCodePath = () => `/v1/auth/sms/send`;

export const requestSmsCode = async (phone: string) => {
  const response = await getFetchInstance().post<{ expireAt: string }>(
    getRequestSmsCodePath(),
    { phone },
  );
  return response.data;
};

export const useRequestSmsCode = () => {
  return useMutation({
    mutationFn: (phone: string) => requestSmsCode(phone),
  });
};
