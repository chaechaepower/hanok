import { useInfiniteQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { GetFollowingResponse } from '@/types';

export const getFollowingPath = () => '/v1/following';

export const getFollowing = async (page: number) => {
  const response = await getFetchInstance().get<GetFollowingResponse>(getFollowingPath(), {
    params: { page },
  });
  return response.data;
};

export const useGetFollowedStores = () => {
  return useInfiniteQuery({
    queryKey: ['followedStores'],
    queryFn: ({ pageParam }) => getFollowing(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
};
