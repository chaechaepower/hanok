import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, NftReceiptResponse } from '@/types';

export const getNftReceiptPath = (escrowId: string | number) => `/v1/escrows/${escrowId}/nft`;

export const getNftReceipt = async (escrowId: string | number) => {
  const response = await getFetchInstance().get<ApiResponse<NftReceiptResponse>>(getNftReceiptPath(escrowId));
  return response.data;
};

export const useGetNftReceipt = (escrowId: string | number | null, polling = false) => {
  return useQuery({
    queryKey: ['nftReceipt', escrowId],
    queryFn: () => getNftReceipt(escrowId!),
    enabled: !!escrowId,
    refetchInterval: polling ? 5000 : false,
    throwOnError: false,
    retry: false,
  });
};
