import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { GetAddressesResponse } from '@/types';

export const getAddressesPath = () => '/v1/users/me/addresses';

export const getAddresses = async () => {
  const response = await getFetchInstance().get<GetAddressesResponse>(getAddressesPath());
  return response.data;
};

export const useGetAddresses = (enabled = true) => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled,
  });
};
