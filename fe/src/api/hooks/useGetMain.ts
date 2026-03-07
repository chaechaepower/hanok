import { useSuspenseQuery } from '@tanstack/react-query';

import type { ExData } from '@/types';
import { getFetchInstance } from '../instance';

export const getExPath = () => `/ex`;

export const getEx = async () => {
  const response = await getFetchInstance().get<ExData[]>(getExPath());
  return response.data;
};

export const useGetMain = () => {
  return useSuspenseQuery({
    queryKey: ['ex'],
    queryFn: () => getEx,
    staleTime: 1000 * 60 * 5,
  });
};
