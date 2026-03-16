import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse } from '@/types';

export const getUnreadCountPath = () => '/v1/notifications/unread-count';

export const getUnreadCount = async () => {
  const response = await getFetchInstance().get<ApiResponse<number>>(getUnreadCountPath());
  return response.data.data ?? 0;
};

export const useGetUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    enabled: Boolean(localStorage.getItem('accessToken')),
  });
};
