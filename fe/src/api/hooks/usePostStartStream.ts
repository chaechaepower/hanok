import { useMutation } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { StartStreamRequest, StartStreamResponse } from '@/types';

export const usePostStartStream = (streamId: number) => {
  return useMutation<StartStreamResponse, Error, StartStreamRequest>({
    mutationFn: async (body) => {
      const res = await getFetchInstance().post<StartStreamResponse>(
        `/v1/streams/${streamId}/start`,
        body,
      );
      return res.data;
    },
  });
};
