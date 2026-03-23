import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { StartStreamResponse, StreamMultipartPayload } from '@/types';
import { buildStreamFormData } from '../../utils/buildStreamFormData';

export const usePostStartStream = () => {
  const queryClient = useQueryClient();

  return useMutation<StartStreamResponse, Error, { streamId: number } & StreamMultipartPayload>({
    throwOnError: false,
    mutationFn: async ({ streamId, ...payload }) => {
      const formData = buildStreamFormData(payload);
      const res = await getFetchInstance().post<StartStreamResponse>(`/v1/streams/${streamId}/start`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stream', variables.streamId] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
      queryClient.invalidateQueries({ queryKey: ['liveCards'] });
    },
  });
};
