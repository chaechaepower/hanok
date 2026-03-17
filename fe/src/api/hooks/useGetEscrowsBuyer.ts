import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, EscrowItem } from '@/types';

export const getEscrowsBuyerPath = () => `/v1/escrows/buyer`;

export const getEscrowsBuyer = async () => {
  const response = await getFetchInstance().get<ApiResponse<EscrowItem[]>>(getEscrowsBuyerPath());
  return response.data;
};

export const useGetEscrowsBuyer = () => {
  return useQuery({
    queryKey: ['escrowsBuyer'],
    queryFn: getEscrowsBuyer,
    staleTime: 1000 * 60 * 5,
  });
};
