import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, SellerReportData } from '@/types';

export const getSellerReportPath = (sellerId: number) => `/v1/sellers/${sellerId}/report`;

export const getSellerReport = async (sellerId: number) => {
  const response = await getFetchInstance().get<ApiResponse<SellerReportData>>(getSellerReportPath(sellerId));
  return response.data.data;
};

export const useGetSellerReport = (sellerId: number) => {
  return useQuery({
    queryKey: ['sellerReport', sellerId],
    queryFn: () => getSellerReport(sellerId),
    staleTime: 1000 * 60 * 5,
  });
};
