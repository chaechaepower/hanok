import { useMutation } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type {
  PostStreamMacrosRequest,
  PostStreamMacrosResponse,
} from '@/types';

export const usePostStreamMacros = () => {
  return useMutation<PostStreamMacrosResponse, Error, { streamId: number; body: PostStreamMacrosRequest }>({
    mutationFn: async ({ streamId, body }) => {
      const res = await getFetchInstance().post<PostStreamMacrosResponse>(
        `/v1/streams/${streamId}/macros`,
        body,
      );
      return res.data;
    },
  });
};
