import type { AuctionItem } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

export const formatAuctionLabel = (item: AuctionItem) =>
  item.auctionType === 'UNIQUE_TOP'
    ? item.minPrice !== null && item.maxPrice !== null && item.maxPrice > item.minPrice
      ? `${formatPrice(item.minPrice)} ~ ${formatPrice(item.maxPrice)}`
      : formatPrice(item.minPrice ?? 0)
    : formatPrice(item.startPrice ?? 0);
