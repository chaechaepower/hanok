import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, Notification } from '@/types';

export const getNotificationsPath = () => '/v1/notifications';

export const getNotifications = async () => {
  const response = await getFetchInstance().get<ApiResponse<Notification[]>>(getNotificationsPath());
  return response.data.data;
};

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: Boolean(localStorage.getItem('accessToken')),
  });
};
