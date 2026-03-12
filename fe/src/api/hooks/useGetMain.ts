import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { LiveCardData, PageResponse } from '@/types';

export type MainStreamType = 'ALL' | 'FOLLOWING';
export type MainStreamStatus = 'LIVE' | 'SCHEDULED';
export type MainStreamSort = 'LATEST' | 'VIEWER_COUNT';

type GetMainParams = {
  type?: MainStreamType;
  category?: string;
  status?: MainStreamStatus;
  sort?: MainStreamSort;
  page?: number;
  size?: number;
};

export const getMainPath = () => '/v1/streams';

export const getMainLiveStreams = async ({
  type = 'ALL',
  category,
  status = 'LIVE',
  sort = 'LATEST',
  page = 0,
  size = 10,
}: GetMainParams = {}) => {
  const response = await getFetchInstance().get<PageResponse<LiveCardData>>(getMainPath(), {
    params: {
      type,
      category,
      status,
      sort,
      page,
      size,
    },
  });
  return response.data;
};

type UseGetMainParams = Omit<GetMainParams, 'page'>;

export const useGetMain = (params: UseGetMainParams = {}) => {
  const type = params.type ?? 'ALL';
  const category = params.category;
  const status = params.status ?? 'LIVE';
  const sort = params.sort ?? 'LATEST';
  const size = params.size ?? 10;

  return useSuspenseInfiniteQuery({
    queryKey: ['liveCards', type, category ?? null, status, sort, size],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getMainLiveStreams({
        type,
        category,
        status,
        sort,
        size,
        page: typeof pageParam === 'number' ? pageParam : 0,
      }),
    getNextPageParam: (lastPage) => (!lastPage.last ? lastPage.number + 1 : undefined),
    staleTime: 1000 * 60,
  });
};
