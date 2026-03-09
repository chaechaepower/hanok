import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { EscrowListResponse } from '@/types';

export const getEscrowsPath = () => `/v1/escrows`;

export const getEscrows = async () => {
  const response = await getFetchInstance().get<EscrowListResponse>(getEscrowsPath());
  return response.data;
};

export const useGetEscrows = () => {
  return useQuery({
    queryKey: ['escrows'],
    queryFn: getEscrows,
    staleTime: 1000 * 60 * 5,
  });
};
