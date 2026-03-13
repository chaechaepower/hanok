import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { PostStreamResponse, StreamMultipartPayload } from '@/types';
import { buildStreamFormData } from './buildStreamFormData';

// POST /api/v1/streams - 방송 생성 (multipart/form-data: request + thumbnail)
export const usePostStream = () => {
  const queryClient = useQueryClient();

  return useMutation<PostStreamResponse, Error, StreamMultipartPayload>({
    mutationFn: async (payload) => {
      const formData = buildStreamFormData(payload);
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
