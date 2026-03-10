import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { SellerStatusResponse } from '@/types';

export const getSellerStatusPath = () => `/v1/users/me/seller-status`;

export const getSellerStatus = async () => {
  const response = await getFetchInstance().get<SellerStatusResponse>(
    getSellerStatusPath()
  );
  return response.data;
};

export const useGetSellerStatus = (enabled = true) => {
  return useQuery({
    queryKey: ['seller-status'],
    queryFn: getSellerStatus,
    enabled,
  });
};
