import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { GetStreamMacrosResponse } from '@/types';

// GET /api/v1/streams/{streamId}/macros
export const useGetStreamMacros = (streamId: number, category: string) => {
  return useQuery<GetStreamMacrosResponse>({
    queryKey: ['stream-macros', streamId, category],
    queryFn: async () => {
      const res = await getFetchInstance().get<GetStreamMacrosResponse>(
        `/v1/streams/${streamId}/macros?category=${encodeURIComponent(category)}`,
      );
      return res.data;
    },
    enabled: !!category,
  });
};
