import { useMutation } from '@tanstack/react-query';

import { getFetchInstance, queryClient } from '../instance';

export const postCancelEscrowPath = (escrowId: string | number) => `/v1/escrows/${escrowId}/cancel`;

export const postCancelEscrow = async ({
  escrowId,
  cancelReason,
}: {
  escrowId: string | number;
  cancelReason: string;
}) => {
  const response = await getFetchInstance().post(postCancelEscrowPath(escrowId), {
    escrowId,
    cancelReason,
  });
  return response.data;
};

export const usePostCancelEscrow = () => {
  return useMutation({
    mutationFn: (params: { escrowId: string | number; cancelReason: string }) => postCancelEscrow(params),
    throwOnError: false,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrowsSeller'] });
      queryClient.invalidateQueries({ queryKey: ['escrowDetail', variables.escrowId] });
      queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });
    },
  });
};
