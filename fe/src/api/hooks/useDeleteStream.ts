import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { DeleteStreamResponse } from '@/types';

// DELETE /api/v1/streams/{streamId}
export const useDeleteStream = (streamId: number) => {
  const queryClient = useQueryClient();

  return useMutation<DeleteStreamResponse, Error, void>({
    mutationFn: async () => {
      const res = await getFetchInstance().delete<DeleteStreamResponse>(
        `/api/v1/streams/${streamId}`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lives'] }); // 목록 갱신 (선택 사항)
    },
  });
};
