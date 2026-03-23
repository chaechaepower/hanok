import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import type { NewSellerRecommendedStreamsResponse } from '@/types';

import { getFetchInstance } from '../instance';

type GetNewSellerRecommendedStreamsParams = {
  page?: number;
  size?: number;
};

export const getNewSellerRecommendedStreamsPath = () => '/v1/streams/recommend/new-seller';

export const getNewSellerRecommendedStreams = async ({
  page = 0,
  size = 20,
}: GetNewSellerRecommendedStreamsParams = {}) => {
  const response = await getFetchInstance().get<NewSellerRecommendedStreamsResponse>(
    getNewSellerRecommendedStreamsPath(),
    {
      params: {
        page,
        size,
      },
    },
  );

  return response.data;
};

type UseGetNewSellerRecommendedStreamsParams = Omit<GetNewSellerRecommendedStreamsParams, 'page'>;

export const useGetNewSellerRecommendedStreams = (params: UseGetNewSellerRecommendedStreamsParams = {}) => {
  const size = params.size ?? 20;

  return useInfiniteQuery({
    queryKey: ['newSellerRecommendedStreams', size],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getNewSellerRecommendedStreams({
        page: typeof pageParam === 'number' ? pageParam : 0,
        size,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  });
};
