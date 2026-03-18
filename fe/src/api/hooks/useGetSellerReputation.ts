import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, SellerReputationData } from '@/types';

export const getSellerReputationPath = (sellerId: string | number) => `/v1/sellers/${sellerId}/reputation`;

export const getSellerReputation = async (sellerId: string | number) => {
  const response = await getFetchInstance().get<ApiResponse<SellerReputationData>>(getSellerReputationPath(sellerId));
  return response.data.data;
};

export const useGetSellerReputation = (sellerId: string | number) => {
  return useQuery({
    queryKey: ['sellerReputation', sellerId],
    queryFn: () => getSellerReputation(sellerId),
    staleTime: 1000 * 60 * 5, // 5분
  });
};
