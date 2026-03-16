import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { StreamMultipartPayload, UpdateStreamResponse } from '@/types';
import { buildStreamFormData } from './buildStreamFormData';

export const usePatchStream = (streamId: number) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateStreamResponse, Error, StreamMultipartPayload>({
    mutationFn: async (payload) => {
      const formData = buildStreamFormData(payload);
      const res = await getFetchInstance().patch<UpdateStreamResponse>(`/v1/streams/${streamId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
      queryClient.invalidateQueries({ queryKey: ['liveCards'] });
    },
  });
};
