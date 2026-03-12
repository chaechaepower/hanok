import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse } from '@/types';

export const getCheckEmailDuplicatePath = () => `/v1/auth/check-email`;

export const checkEmailDuplicate = async (email: string) => {
  const response = await getFetchInstance().get<ApiResponse>(
    getCheckEmailDuplicatePath(),
    { params: { email } },
  );
  return response.data;
};

export const useCheckEmailDuplicate = () => {
  return useMutation({
    mutationFn: (email: string) => checkEmailDuplicate(email),
  });
};
