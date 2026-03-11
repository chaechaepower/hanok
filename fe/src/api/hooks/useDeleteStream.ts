import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { DeleteStreamResponse } from '@/types';

const deleteStreamPath = (streamId: number) => `/v1/streams/${streamId}`;

export const deleteStream = async (streamId: number) => {
  const response = await getFetchInstance().delete<DeleteStreamResponse>(deleteStreamPath(streamId));
  return response.data;
};

export const useDeleteStream = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteStreamResponse, Error, number>({
    mutationFn: deleteStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
    },
  });
};
