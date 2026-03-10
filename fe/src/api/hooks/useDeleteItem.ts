import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { DeleteItemResponse } from '@/types';

const deleteItemPath = (itemId: number) => `/v1/items/${itemId}`;

export const deleteItem = async (itemId: number) => {
  const response = await getFetchInstance().delete(deleteItemPath(itemId));
  return response.data;
};

export const useDeleteItem = () => {
  return useMutation<DeleteItemResponse, Error, number>({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
