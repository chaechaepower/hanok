import { useMutation } from '@tanstack/react-query';

import { getFetchInstance, queryClient } from '../instance';

export const postCompleteEscrowPath = (escrowId: string | number) => `/v1/escrows/${escrowId}/complete`;

export const postCompleteEscrow = async (escrowId: string | number) => {
  const response = await getFetchInstance().post(postCompleteEscrowPath(escrowId));
  return response.data;
};

export const usePostCompleteEscrow = () => {
  return useMutation({
    mutationFn: postCompleteEscrow,
    onSuccess: (_, escrowId) => {
      queryClient.invalidateQueries({ queryKey: ['escrowsBuyer'] });
      queryClient.invalidateQueries({ queryKey: ['escrowDetail', escrowId] });
    },
  });
};
