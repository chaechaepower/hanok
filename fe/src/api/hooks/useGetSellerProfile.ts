import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { ApiResponse, SellerProfileResponse } from '@/types';

export const getSellerProfilePath = (sellerId: number) => `/v1/sellers/${sellerId}/profile`;

export const getSellerProfile = async (sellerId: number) => {
  const response = await getFetchInstance().get<ApiResponse<SellerProfileResponse>>(getSellerProfilePath(sellerId));
  return response.data.data;
};

export const useGetSellerProfile = (sellerId: number) => {
  return useQuery({
    queryKey: ['sellerProfile', sellerId],
    queryFn: () => getSellerProfile(sellerId),
    enabled: !!sellerId,
  });
};
