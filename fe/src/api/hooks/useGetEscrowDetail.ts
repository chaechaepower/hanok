import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, EscrowDetailResponse } from '@/types';

export const getEscrowDetailPath = (escrowId: string | number) => `/v1/escrows/${escrowId}`;

export const getEscrowDetail = async (escrowId: string | number) => {
  const response = await getFetchInstance().get<ApiResponse<EscrowDetailResponse>>(getEscrowDetailPath(escrowId));
  return response.data;
};

export const useGetEscrowDetail = (escrowId: string | number | null) => {
  return useQuery({
    queryKey: ['escrowDetail', escrowId],
    queryFn: () => getEscrowDetail(escrowId!),
    enabled: !!escrowId,
    staleTime: 1000 * 60 * 5,
  });
};
