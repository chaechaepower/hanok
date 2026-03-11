import { useMutation } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type {
  PostStreamMacrosRequest,
  PostStreamMacrosResponse,
} from '@/types';

// POST /api/v1/streams/{streamId}/macros
export const usePostStreamMacros = (streamId: number) => {
  return useMutation<PostStreamMacrosResponse, Error, PostStreamMacrosRequest>({
    mutationFn: async (body) => {
      const res = await getFetchInstance().post<PostStreamMacrosResponse>(
        `/api/v1/streams/${streamId}/macros`,
        body,
      );
      return res.data;
    },
  });
};
