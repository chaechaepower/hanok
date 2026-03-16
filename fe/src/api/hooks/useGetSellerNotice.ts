import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { NoticeItem } from '@/types';

export const getSellerNoticePath = (sellerId: number) => `/v1/sellers/${sellerId}/notices`;

export const getSellerNotice = async (sellerId: number) => {
  const response = await getFetchInstance().get<NoticeItem[]>(getSellerNoticePath(sellerId));
  return response.data;
};

export const useGetSellerNotice = (sellerId: number) => {
  return useQuery({
    queryKey: ['sellerNotice', sellerId],
    queryFn: () => getSellerNotice(sellerId),
    enabled: !!sellerId,
  });
};
