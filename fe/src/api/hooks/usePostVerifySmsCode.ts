import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { VerifySmsResponse } from '@/types';

export const getVerifySmsCodePath = () => `/v1/auth/sms/verify`;

export const verifySmsCode = async (phone: string, code: string) => {
  const response = await getFetchInstance().post<VerifySmsResponse>(
    getVerifySmsCodePath(),
    { phone, code },
  );
  return response.data;
};

export const useVerifySmsCode = () => {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      verifySmsCode(phone, code),
  });
};
