import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { DeleteSellerNoticeResponse } from '@/types';

export const deleteSellerNoticePath = (sellerId: number, postId: number) =>
  `/v1/sellers/${sellerId}/posts/${postId}`;

export const deleteSellerNotice = async (sellerId: number, postId: number) => {
  const response = await getFetchInstance().delete<DeleteSellerNoticeResponse>(
    deleteSellerNoticePath(sellerId, postId)
  );
  return response.data;
};

export const useDeleteSellerNotice = (sellerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => deleteSellerNotice(sellerId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sellerNotice', sellerId],
      });
    },
  });
};
