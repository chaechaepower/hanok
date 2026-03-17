import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { SearchStreamResult } from '@/types';


export const getSearchPath = () => '/v1/search';

export const getSearchResults = async (keyword: string) => {
  const response = await getFetchInstance().get<SearchStreamResult[]>(getSearchPath(), {
    params: { keyword },
  });

  return response.data;
};

export const useGetSearch = (keyword: string, enabled = true) => {
  return useQuery({
    queryKey: ['search', keyword],
    queryFn: () => getSearchResults(keyword),
    enabled,
    staleTime: 1000 * 30,
    retry: 0,
    throwOnError: false,
  });
};
