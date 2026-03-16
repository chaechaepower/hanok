import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { PatchSellerNoticePayload, PatchSellerNoticeResponse } from '@/types';

export const patchSellerNoticePath = (sellerId: number, noticeId: number) =>
  `/v1/sellers/${sellerId}/notices/${noticeId}`;

export const patchSellerNotice = async (sellerId: number, noticeId: number, payload: PatchSellerNoticePayload) => {
  const response = await getFetchInstance().patch<PatchSellerNoticeResponse>(
    patchSellerNoticePath(sellerId, noticeId),
    payload,
  );
  return response.data;
};

export const usePatchSellerNotice = (sellerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noticeId, payload }: { noticeId: number; payload: PatchSellerNoticePayload }) =>
      patchSellerNotice(sellerId, noticeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sellerNotice', sellerId],
      });
    },
  });
};
