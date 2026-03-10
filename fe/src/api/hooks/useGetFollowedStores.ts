import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { GetFollowingResponse } from '@/types';

export const getFollowingPath = () => '/v1/following';

export const getFollowing = async () => {
  const response = await getFetchInstance().get<GetFollowingResponse>(getFollowingPath());
  return response.data;
};

export const useGetFollowedStores = () => {
  return useQuery({
    queryKey: ['followedStores'],
    queryFn: getFollowing,
    staleTime: 1000 * 60,
  });
};
