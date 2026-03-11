import { useMutation } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { StartStreamRequest, StartStreamResponse } from '@/types';

export const usePostStartStream = () => {
  return useMutation<StartStreamResponse, Error, { streamId: number; body: StartStreamRequest }>({
    mutationFn: async ({ streamId, body }) => {
      const res = await getFetchInstance().post<StartStreamResponse>(
        `/v1/streams/${streamId}/start`,
        body,
      );
      return res.data;
    },
  });
};
