import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { GetSellerNoticeParams, GetSellerNoticeResponse } from '@/types';

export const getSellerNoticePath = (sellerId: number) =>
  `/v1/sellers/${sellerId}/notice`;

export const getSellerNotice = async (
  sellerId: number,
  params: GetSellerNoticeParams
) => {
  const response = await getFetchInstance().get<GetSellerNoticeResponse>(
    getSellerNoticePath(sellerId),
    { params }
  );
  return response.data;
};

export const useGetSellerNotice = (
  sellerId: number,
  params: GetSellerNoticeParams
) => {
  return useQuery({
    queryKey: ['sellerNotice', sellerId, params.page, params.limit],
    queryFn: () => getSellerNotice(sellerId, params),
    enabled: !!sellerId,
  });
};
