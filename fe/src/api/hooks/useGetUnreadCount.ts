import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';

export const getUnreadCountPath = () => '/v1/notifications/unread-count';

export const getUnreadCount = async () => {
  const response = await getFetchInstance().get<number>(getUnreadCountPath());
  return response.data;
};

export const useGetUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    enabled: Boolean(localStorage.getItem('accessToken')),
  });
};
