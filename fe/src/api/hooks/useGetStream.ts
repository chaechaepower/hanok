import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { Live } from '@/types';

// GET /api/v1/streams/{streamId} - 방송 단건 조회
export const useGetStream = (streamId: number) => {
  return useQuery<Live, Error>({
    queryKey: ['stream', streamId],
    queryFn: async () => {
      const res = await getFetchInstance().get<Live>(`/api/v1/streams/${streamId}`);
      return res.data;
    },
    enabled: !!streamId,
  });
};
