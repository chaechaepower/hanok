import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse,GetNotificationResponse } from '@/types';

export const getNotificationPath = () => '/v1/users/me/notification';

export const getNotification = async () => {
  const response = await getFetchInstance().get<ApiResponse<GetNotificationResponse>>(getNotificationPath());
  return response.data;
};

export const useGetNotification = () => {
  return useQuery({
    queryKey: ['me', 'notification'],
    queryFn: getNotification,
    staleTime: 1000 * 60 * 5,
  });
};
