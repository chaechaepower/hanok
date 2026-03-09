import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { PostSellerNoticePayload, PostSellerNoticeResponse } from '@/types';

export const postSellerNoticePath = (sellerId: number) =>
  `/v1/sellers/${sellerId}/posts`;

export const postSellerNotice = async (
  sellerId: number,
  payload: PostSellerNoticePayload
) => {
  const response = await getFetchInstance().post<PostSellerNoticeResponse>(
    postSellerNoticePath(sellerId),
    payload
  );
  return response.data;
};

export const usePostSellerNotice = (sellerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PostSellerNoticePayload) =>
      postSellerNotice(sellerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sellerNotice', sellerId],
      });
    },
  });
};
