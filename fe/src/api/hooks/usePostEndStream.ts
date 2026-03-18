import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '@/api/instance';
import type { EndStreamResponse } from '@/types';

const postEndStreamPath = (streamId: number) => `/v1/streams/${streamId}/end`;

export const postEndStream = async (streamId: number) => {
  const response = await getFetchInstance().post<EndStreamResponse>(postEndStreamPath(streamId));
  return response.data;
};

export const usePostEndStream = () => {
  const queryClient = useQueryClient();

  return useMutation<EndStreamResponse, Error, number>({
    mutationFn: postEndStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
      queryClient.invalidateQueries({ queryKey: ['liveCards'] });
    },
  });
};
