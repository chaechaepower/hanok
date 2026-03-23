import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, SellerRankingItem } from '@/types';

export const getSellerRankingPath = () => '/v1/sellers/ranking';

export const getSellerRanking = async () => {
  const response = await getFetchInstance().get<ApiResponse<SellerRankingItem[]>>(getSellerRankingPath());
  const payload = response.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.data) ? payload.data : [];
};

export const useGetSellerRanking = () => {
  return useQuery({
    queryKey: ['sellerRanking'],
    queryFn: getSellerRanking,
    staleTime: 1000 * 60,
  });
};
