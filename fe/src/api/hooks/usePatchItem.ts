import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { UpdateItemPayload, UpdateItemResponse } from '@/types';

const patchItemPath = (itemId: number) => `/v1/items/${itemId}`;

export const usePatchItem = () => {
  return useMutation<UpdateItemResponse, Error, { itemId: number; payload: UpdateItemPayload }>({
    mutationFn: async ({ itemId, payload }) => {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);

      if (payload.startPrice !== undefined) formData.append('startPrice', payload.startPrice.toString());
      if (payload.bidUnit !== undefined) formData.append('bidUnit', payload.bidUnit.toString());
      if (payload.auctionDuration !== undefined) formData.append('auctionDuration', payload.auctionDuration.toString());
      if (payload.categoryId !== undefined) formData.append('categoryId', payload.categoryId.toString());
      if (payload.condition !== undefined) formData.append('condition', payload.condition);
      if (payload.auctionMethod !== undefined) formData.append('auctionMethod', payload.auctionMethod);

      if (payload.existingImageUrls && payload.existingImageUrls.length > 0) {
        payload.existingImageUrls.forEach((url) => {
          formData.append('existingImageUrls', url);
        });
      }

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

      const response = await getFetchInstance().patch(patchItemPath(itemId), formData, {
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
