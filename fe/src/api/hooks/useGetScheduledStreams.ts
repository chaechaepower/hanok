import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { ScheduledStreamsResponse } from '@/types';

export const useGetScheduledStreams = (page = 0, size = 8) => {
  return useQuery<ScheduledStreamsResponse, Error>({
    queryKey: ['scheduled-streams', page, size],
    queryFn: async () => {
      const res = await getFetchInstance().get<ScheduledStreamsResponse>(
        '/v1/streams/scheduled',
        { params: { page, size } },
      );
      return res.data;
    },
  });
};
