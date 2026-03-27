import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { SearchSellerResult } from '@/types';

export const getSearchSellersPath = () => '/v1/search/sellers';

export const getSearchSellerResults = async (keyword: string) => {
  const response = await getFetchInstance().get<SearchSellerResult[]>(getSearchSellersPath(), {
    params: { keyword },
  });

  return response.data;
};

export const useGetSearchSellers = (keyword: string, enabled = true) => {
  return useQuery({
    queryKey: ['searchSellers', keyword],
    queryFn: () => getSearchSellerResults(keyword),
    enabled,
    staleTime: 1000 * 30,
    retry: 0,
    throwOnError: false,
  });
};
