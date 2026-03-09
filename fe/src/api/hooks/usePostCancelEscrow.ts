import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import { queryClient } from '../instance';

export const postCancelEscrowPath = (escrowId: string | number) =>
  `/v1/escrows/${escrowId}/cancel`;

export const postCancelEscrow = async (escrowId: string | number) => {
  const response = await getFetchInstance().post(postCancelEscrowPath(escrowId));
  return response.data;
};

export const usePostCancelEscrow = () => {
  return useMutation({
    mutationFn: postCancelEscrow,
    onSuccess: () => {
      // 취소 후 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['escrowDetail'] });
    },
  });
};
