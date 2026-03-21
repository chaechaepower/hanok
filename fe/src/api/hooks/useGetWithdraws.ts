import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, WithdrawItem, WithdrawStatus } from '@/types';

export const getWithdrawsPath = () => `/v1/admin/withdraws`;

export const getWithdraws = async (status?: WithdrawStatus) => {
  const params = status ? { status } : {};
  const response = await getFetchInstance().get<ApiResponse<WithdrawItem[]>>(getWithdrawsPath(), { params });
  return response.data.data;
};

export const useGetWithdraws = (status?: WithdrawStatus) => {
  return useQuery({
    queryKey: ['admin-withdraws', status],
    queryFn: () => getWithdraws(status),
    staleTime: 1000 * 60,
  });
};
