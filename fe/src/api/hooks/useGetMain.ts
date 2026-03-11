import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { LiveCardData, PageResponse } from '@/types';

export type MainStreamType = 'ALL' | 'FOLLOWING';
export type MainStreamStatus = 'LIVE' | 'SCHEDULED';
export type MainStreamSort = 'LATEST' | 'VIEWER_COUNT';

type GetMainParams = {
  type?: MainStreamType;
  categoryId?: number;
  status?: MainStreamStatus;
  sort?: MainStreamSort;
  page?: number;
  size?: number;
};

export const getMainPath = () => '/v1/streams';

export const getMainLiveStreams = async ({
  type = 'ALL',
  categoryId,
  status = 'LIVE',
  sort = 'LATEST',
  page = 0,
  size = 10,
}: GetMainParams = {}) => {
  const response = await getFetchInstance().get<PageResponse<LiveCardData>>(getMainPath(), {
    params: {
      type,
      status,
      sort,
      page,
      size,
      ...(categoryId !== undefined ? { categoryId } : {}),
    },
  });
  return response.data;
};

type UseGetMainParams = Omit<GetMainParams, 'page'>;

export const useGetMain = (params: UseGetMainParams = {}) => {
  const type = params.type ?? 'ALL';
  const categoryId = params.categoryId;
  const status = params.status ?? 'LIVE';
  const sort = params.sort ?? 'LATEST';
  const size = params.size ?? 10;

  return useSuspenseInfiniteQuery({
    queryKey: ['liveCards', type, categoryId ?? null, status, sort, size],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getMainLiveStreams({
        type,
        categoryId,
        status,
        sort,
        size,
        page: typeof pageParam === 'number' ? pageParam : 0,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    staleTime: 1000 * 60,
  });
};
