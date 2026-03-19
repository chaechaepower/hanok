import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { CreateItemPayload, CreateItemResponse } from '@/types';

const postItemPath = () => '/v1/items';

export const usePostItem = () => {
  return useMutation<CreateItemResponse, Error, CreateItemPayload>({
    throwOnError: false,
    mutationFn: async (payload) => {
      const { images, ...request } = payload;
      const formData = new FormData();
      formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));

      if (images) {
        images.forEach((file) => formData.append('images', file));
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
