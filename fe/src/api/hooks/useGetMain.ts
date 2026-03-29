import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { LiveCardData, PageResponse } from '@/types';

export type MainStreamType = 'ALL' | 'FOLLOWING';
export type MainStreamStatus = 'LIVE' | 'PAUSED' | 'SCHEDULED';
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

type UseGetMainParams = Omit<GetMainParams, 'page'> & {
  enabled?: boolean;
};

export const useGetMain = (params: UseGetMainParams = {}) => {
  const type = params.type ?? 'ALL';
  const category = params.category;
  const status = params.status ?? 'LIVE';
  const sort = params.sort ?? 'LATEST';
  const size = params.size ?? 10;
  const normalizePage = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  const getPageMetadata = (pageResponse: PageResponse<LiveCardData>) => {
    const compactPage = pageResponse.page;
    const contentLength = Array.isArray(pageResponse.content) ? pageResponse.content.length : 0;

    return {
      currentPage: normalizePage(pageResponse.number ?? compactPage?.number ?? pageResponse.pageable?.pageNumber),
      totalPages: normalizePage(pageResponse.totalPages ?? compactPage?.totalPages),
      totalElements: normalizePage(pageResponse.totalElements ?? compactPage?.totalElements),
      pageSize: normalizePage(pageResponse.size ?? compactPage?.size ?? pageResponse.pageable?.pageSize ?? size),
      numberOfElements: normalizePage(pageResponse.numberOfElements ?? contentLength),
      contentLength,
      isLast: pageResponse.last,
    };
  };

  return useInfiniteQuery({
    queryKey: ['liveCards', type, category ?? null, status, sort, size],
    enabled: params.enabled ?? true,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getMainLiveStreams({
        type,
        category,
        status,
        sort,
        size,
        page: normalizePage(pageParam),
      }),
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages, totalElements, pageSize, numberOfElements, contentLength, isLast } =
        getPageMetadata(lastPage);
      const isLastByTotalPages = totalPages > 0 && currentPage >= totalPages - 1;
      const isLastByEmptyPage = numberOfElements === 0 || contentLength === 0;
      const isLastByShortPage = contentLength < size;
      const isLastByTotalElements =
        totalElements > 0 && pageSize > 0 && currentPage * pageSize + numberOfElements >= totalElements;

      if (isLast || isLastByTotalPages || isLastByEmptyPage || isLastByShortPage || isLastByTotalElements) {
        return undefined;
      }

      return currentPage + 1;
    },
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  });
};
