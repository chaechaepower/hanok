import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { PutSellerNoticePayload, PutSellerNoticeResponse } from '@/types';

export const putSellerNoticePath = (sellerId: number, noticeId: number) =>
  `/v1/sellers/${sellerId}/notices/${noticeId}`;

export const putSellerNotice = async (sellerId: number, noticeId: number, payload: PutSellerNoticePayload) => {
  const response = await getFetchInstance().put<PutSellerNoticeResponse>(
    putSellerNoticePath(sellerId, noticeId),
    payload,
  );
  return response.data;
};

export const usePutSellerNotice = (sellerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noticeId, payload }: { noticeId: number; payload: PutSellerNoticePayload }) =>
      putSellerNotice(sellerId, noticeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sellerNotice', sellerId],
      });
    },
  });
};
