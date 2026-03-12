import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, WalletResponse } from '@/types';

export const getWalletPath = () => '/v1/wallet';

export const getWallet = async () => {
  const response = await getFetchInstance().get<ApiResponse<WalletResponse>>(getWalletPath());
  return response.data.data;
};

export const useGetWallet = (enabled = true) => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
    staleTime: 1000 * 30,
    enabled,
  });
};
