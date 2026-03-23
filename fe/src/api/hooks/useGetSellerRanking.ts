import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { SellerRankingItem } from '@/types';

export const getSellerRankingPath = () => '/v1/sellers/ranking';

export const getSellerRanking = async () => {
  const response = await getFetchInstance().get<SellerRankingItem[]>(getSellerRankingPath());
  return response.data;
};

export const useGetSellerRanking = () => {
  return useQuery({
    queryKey: ['sellerRanking'],
    queryFn: getSellerRanking,
    staleTime: 1000 * 60,
  });
};
