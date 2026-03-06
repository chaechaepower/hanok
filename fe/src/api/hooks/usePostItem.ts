import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { CreateItemPayload, CreateItemResponse } from '@/types';

const postItemPath = () => '/v1/items';

export const usePostItem = () => {
  return useMutation<CreateItemResponse, Error, CreateItemPayload>({
    mutationFn: async (payload) => {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('startPrice', String(payload.startPrice));
      formData.append('auctionDuration', String(payload.auctionDuration));
      formData.append('bidUnit', String(payload.bidUnit));
      formData.append('categoryId', String(payload.categoryId));

      if (payload.newImages && payload.newImages.length > 0) {
        payload.newImages.forEach((file) => {
          formData.append('newImages', file);
        });
      }

      if (payload.tags && payload.tags.length > 0) {
        payload.tags.forEach((tag) => {
          formData.append('tags', tag);
        });
      }

      const response = await getFetchInstance().post(postItemPath(), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
