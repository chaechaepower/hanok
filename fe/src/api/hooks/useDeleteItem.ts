import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { DeleteItemResponse } from '@/types';

const deleteItemPath = (itemId: number) => `/v1/items/${itemId}`;

export const useDeleteItem = () => {
  return useMutation<DeleteItemResponse, Error, number>({
    mutationFn: async (itemId) => {
      const response = await getFetchInstance().delete(deleteItemPath(itemId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
