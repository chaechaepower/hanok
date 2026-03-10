import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { GetMeResponse } from '@/types';

export const getMePath = () => '/v1/users/me';

export const getMe = async () => {
  const response = await getFetchInstance().get<GetMeResponse>(getMePath());
  // The API response seems to directly return the object instead of { data: ... }
  // but if the standard is ApiResponse<T>, we should check.
  // Wait, let's look at the response from user:
  // {
  //   "email": "user@example.com",
  //   ...
  // }
  // So it might not be wrapped in ApiResponse. I will return `response` directly if it's not wrapped or just `response` or `response.data`. Actually, axios returns response.data regardless of our wrapper if our wrapper isn't used, but our fetch instance might be returning data directly or not. Let's stick with `response.data` as other hooks do `response.data`. Wait, if `ApiResponse<T>` is not used, it's just `response.data`.
  return response.data;
};

export const useGetMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 1000 * 60,
  });
};
