import { useQuery } from '@tanstack/react-query';

import type { StreamEnterResponse } from '@/types';

import { getFetchInstance } from '../instance';

export const getStreamEnterPath = (streamId: number) => `/v1/streams/${streamId}/enter`;

export const getStreamEnter = async (streamId: number) => {
  const response = await getFetchInstance().get<StreamEnterResponse>(getStreamEnterPath(streamId));
  return response.data;
};

export const useGetStreamEnter = (streamId: number, enabled = true) => {
  return useQuery({
    queryKey: ['streamEnter', streamId],
    queryFn: () => getStreamEnter(streamId),
    enabled: enabled && Number.isFinite(streamId) && streamId > 0,
  });
};
