import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { PatchSellerProfilePayload } from '@/types/seller';

const patchSellerProfilePath = (sellerId: number) => `/v1/sellers/${sellerId}/profile`;

export const usePatchSellerProfile = (sellerId: number) => {
  return useMutation({
    mutationFn: async (payload: PatchSellerProfilePayload) => {
      const response = await getFetchInstance().patch(patchSellerProfilePath(sellerId), payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProfile', sellerId] });
    },
  });
};
