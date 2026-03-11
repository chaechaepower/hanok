import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { StartStreamRequest, PostStreamResponse } from '@/types';

// POST /api/v1/streams - 방송 생성 (multipart/form-data: request + thumbnail)
export const usePostStream = () => {
  const queryClient = useQueryClient();

  return useMutation<PostStreamResponse, Error, { request: StartStreamRequest; thumbnail?: File }>({
    mutationFn: async ({ request, thumbnail }) => {
      const formData = new FormData();
      formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }
      const res = await getFetchInstance().post<PostStreamResponse>('/v1/streams', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
    },
  });
};
