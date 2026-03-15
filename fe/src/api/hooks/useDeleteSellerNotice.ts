import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';

export const deleteSellerNoticePath = (sellerId: number, noticeId: number) =>
  `/v1/sellers/${sellerId}/notices/${noticeId}`;

export const deleteSellerNotice = async (sellerId: number, noticeId: number) => {
  await getFetchInstance().delete(deleteSellerNoticePath(sellerId, noticeId));
};

export const useDeleteSellerNotice = (sellerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noticeId: number) => deleteSellerNotice(sellerId, noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sellerNotice', sellerId],
      });
    },
  });
};
