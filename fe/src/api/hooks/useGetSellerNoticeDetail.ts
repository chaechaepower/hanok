import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { NoticeItem } from '@/types';

const getSellerNoticeDetailPath = (sellerId: number, noticeId: number) =>
  `/v1/sellers/${sellerId}/notices/${noticeId}`;

export const getSellerNoticeDetail = async (sellerId: number, noticeId: number) => {
  const response = await getFetchInstance().get<NoticeItem>(getSellerNoticeDetailPath(sellerId, noticeId));
  return response.data;
};

export const useGetSellerNoticeDetail = (sellerId: number, noticeId: number | null) => {
  return useQuery({
    queryKey: ['sellerNoticeDetail', sellerId, noticeId],
    queryFn: () => getSellerNoticeDetail(sellerId, noticeId!),
    enabled: !!sellerId && noticeId !== null,
  });
};
