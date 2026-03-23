import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { UpdateItemPayload, UpdateItemResponse } from '@/types';

const patchItemPath = (itemId: number) => `/v1/items/${itemId}`;

export const usePatchItem = () => {
  return useMutation<UpdateItemResponse, Error, { itemId: number; payload: UpdateItemPayload }>({
    throwOnError: false,
    mutationFn: async ({ itemId, payload }) => {
      const { image1, image2, image3, ...request } = payload;
      const formData = new FormData();
      formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));

      if (image1) formData.append('image1', image1);
      if (image2) formData.append('image2', image2);
      if (image3) formData.append('image3', image3);

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
