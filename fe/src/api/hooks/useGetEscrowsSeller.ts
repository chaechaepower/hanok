import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, EscrowItem } from '@/types';

export const getEscrowsSellerPath = () => `/v1/escrows/seller`;

export const getEscrowsSeller = async () => {
  const response = await getFetchInstance().get<ApiResponse<EscrowItem[]>>(getEscrowsSellerPath());
  return response.data;
};

export const useGetEscrowsSeller = () => {
  return useQuery({
    queryKey: ['escrowsSeller'],
    queryFn: getEscrowsSeller,
    staleTime: 1000 * 60 * 5,
  });
};
