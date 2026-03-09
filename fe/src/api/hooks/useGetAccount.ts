import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { UserAccountResponse } from '@/types';

export const getAccountPath = () => '/v1/users/me/account';

export const getAccount = async () => {
  const response = await getFetchInstance().get<UserAccountResponse>(getAccountPath());
  return response.data;
};

export const useGetAccount = () => {
  return useQuery({
    queryKey: ['account'],
    queryFn: getAccount,
    staleTime: 1000 * 60,
  });
};
