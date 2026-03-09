import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { PatchSellerNoticePayload, PatchSellerNoticeResponse } from '@/types';

export const patchSellerNoticePath = (sellerId: number, postId: number) =>
  `/v1/sellers/${sellerId}/posts/${postId}`;

export const patchSellerNotice = async (
  sellerId: number,
  postId: number,
  payload: PatchSellerNoticePayload
) => {
  const response = await getFetchInstance().patch<PatchSellerNoticeResponse>(
    patchSellerNoticePath(sellerId, postId),
    payload
  );
  return response.data;
};

export const usePatchSellerNotice = (sellerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      payload,
    }: {
      postId: number;
      payload: PatchSellerNoticePayload;
    }) => patchSellerNotice(sellerId, postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sellerNotice', sellerId],
      });
    },
  });
};
