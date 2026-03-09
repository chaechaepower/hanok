import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { RegisterAccountPayload, RegisterAccountResponse } from '@/types';

export const getRegisterAccountPath = () => `/v1/sellers/account`;

export const registerAccount = async (payload: RegisterAccountPayload) => {
  const response = await getFetchInstance().post<RegisterAccountResponse>(
    getRegisterAccountPath(),
    payload,
  );
  return response.data;
};

export const useRegisterAccount = () => {
  return useMutation({
    mutationFn: (payload: RegisterAccountPayload) => registerAccount(payload),
    throwOnError: false,
  });
};
