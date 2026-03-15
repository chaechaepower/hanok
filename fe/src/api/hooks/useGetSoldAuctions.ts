import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { SoldAuctionItem } from '@/types';

const getSoldAuctionsPath = (sellerId: number) => `/v1/sellers/${sellerId}/sold-auctions`;

export const getSoldAuctions = async (sellerId: number) => {
  const response = await getFetchInstance().get<SoldAuctionItem[]>(getSoldAuctionsPath(sellerId));
  return response.data;
};

export const useGetSoldAuctions = (sellerId: number) => {
  return useQuery({
    queryKey: ['soldAuctions', sellerId],
    queryFn: () => getSoldAuctions(sellerId),
    enabled: !!sellerId,
  });
};
