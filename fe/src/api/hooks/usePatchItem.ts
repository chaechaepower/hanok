import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { UpdateItemPayload, UpdateItemResponse } from '@/types';

const patchItemPath = (itemId: number) => `/v1/items/${itemId}`;

export const usePatchItem = () => {
  return useMutation<UpdateItemResponse, Error, { itemId: number; payload: UpdateItemPayload }>({
    throwOnError: false,
    mutationFn: async ({ itemId, payload }) => {
      const { images, ...request } = payload;
      const formData = new FormData();
      formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));

      if (images) {
        images.forEach((file) => formData.append('images', file));
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
