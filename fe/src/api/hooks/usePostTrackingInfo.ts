import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { PostTrackingInfoPayload } from '@/types';
import { queryClient } from '../instance';

export const postTrackingInfoPath = (escrowId: string | number) => `/v1/escrows/${escrowId}/tracking`;

export const postTrackingInfo = async ({
  escrowId,
  ...payload
}: PostTrackingInfoPayload & { escrowId: string | number }) => {
  const response = await getFetchInstance().post(postTrackingInfoPath(escrowId), payload);
  return response.data;
};

export const usePostTrackingInfo = () => {
  return useMutation({
    mutationFn: postTrackingInfo,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrowsSeller'] });
      queryClient.invalidateQueries({ queryKey: ['escrowDetail', variables.escrowId] });
    },
  });
};
