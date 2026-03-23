import { useQuery } from '@tanstack/react-query';

import type { ApiResponse, NewSellerRecommendedStreamsResponse } from '@/types';

import { getFetchInstance } from '../instance';

type GetNewSellerRecommendedStreamsParams = {
  withinDays?: number;
  limit?: number;
};

export const getNewSellerRecommendedStreamsPath = () => '/v1/streams/recommend/new-seller';

export const getNewSellerRecommendedStreams = async ({
  withinDays = 30,
  limit = 10,
}: GetNewSellerRecommendedStreamsParams = {}) => {
  const response = await getFetchInstance().get<
    NewSellerRecommendedStreamsResponse | ApiResponse<NewSellerRecommendedStreamsResponse>
  >(
    getNewSellerRecommendedStreamsPath(),
    {
      params: {
        withinDays,
        limit,
      },
    },
  );

  const payload = response.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.data) ? payload.data : [];
};

type UseGetNewSellerRecommendedStreamsParams = GetNewSellerRecommendedStreamsParams;

export const useGetNewSellerRecommendedStreams = (params: UseGetNewSellerRecommendedStreamsParams = {}) => {
  const withinDays = params.withinDays ?? 30;
  const limit = params.limit ?? 10;

  return useQuery({
    queryKey: ['newSellerRecommendedStreams', withinDays, limit],
    queryFn: () =>
      getNewSellerRecommendedStreams({
        withinDays,
        limit,
      }),
    staleTime: 1000 * 60,
  });
};
