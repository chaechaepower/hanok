import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, GetMeResponse } from '@/types';

export const getMePath = () => '/v1/users/me';

export const getMe = async () => {
  const response = await getFetchInstance().get<ApiResponse<GetMeResponse>>(getMePath());
  return response.data.data;
};

export const useGetMe = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 1000 * 60,
    enabled: options?.enabled,
  });
};
