import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { UpdateStreamRequest, UpdateStreamResponse } from '@/types';

export const usePatchStream = (streamId: number) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateStreamResponse, Error, UpdateStreamRequest>({
    mutationFn: async (body) => {
      const res = await getFetchInstance().patch<UpdateStreamResponse>(
        `/v1/streams/${streamId}`,
        body,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
    },
  });
};
