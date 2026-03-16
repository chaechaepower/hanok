import { useInfiniteQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, NotificationPage } from '@/types';

export const getNotifications = async (cursor?: string, limit = 20) => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', String(limit));

  const response = await getFetchInstance().get<ApiResponse<NotificationPage>>(
    `/v1/notifications?${params.toString()}`,
  );
  return response.data.data;
};

export const useGetNotifications = () => {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined),
    enabled: Boolean(localStorage.getItem('accessToken')),
  });
};
