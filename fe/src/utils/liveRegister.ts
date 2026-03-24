import type { AuctionItem, Product, StreamAuctionItem, StreamDetailItem } from '@/types';

export type AuctionNumberField = 'startPrice' | 'bidUnit' | 'minPrice' | 'maxPrice';
export type AuctionFieldErrors = Record<number, Partial<Record<AuctionNumberField, string>>>;

export type LiveRegisterMacroField = {
  questionType: string;
  question: string;
  answer?: string;
};

export const auctionInputClassName =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-bold tabular-nums text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40';

export const toPreviewAuctionItem = (item: Product): AuctionItem => ({
  id: item.itemId,
  name: item.name,
  startPrice: item.auctionType === 'BOTTOM_UP' ? (item.startPrice ?? 0) : null,
  bidUnit: item.auctionType === 'BOTTOM_UP' ? (item.bidUnit ?? 0) : null,
  minPrice: item.auctionType === 'UNIQUE_TOP' ? (item.minPrice ?? item.startPrice ?? 0) : null,
  maxPrice: item.auctionType === 'UNIQUE_TOP' ? (item.maxPrice ?? item.startPrice ?? 0) : null,
  finalPrice: undefined,
  status: 'READY',
  auctionType: item.auctionType ?? 'BOTTOM_UP',
  condition: item.itemCondition as AuctionItem['condition'],
  thumbnailUrl: item.images[0] ?? undefined,
  description: item.description,
  auctionTime: item.auctionDuration ?? 60,
  images: item.images,
});

export const initializeAuctionConfig = (item: Product): Product => {
  const auctionType = item.auctionType ?? 'BOTTOM_UP';
  const auctionDuration = item.auctionDuration ?? 60;

  if (auctionType === 'UNIQUE_TOP') {
    return {
      ...item,
      auctionType,
      auctionDuration,
      startPrice: undefined,
      bidUnit: undefined,
      minPrice: item.minPrice ?? null,
      maxPrice: item.maxPrice ?? null,
    };
  }

  return {
    ...item,
    auctionType,
    auctionDuration,
    startPrice: item.startPrice,
    bidUnit: item.bidUnit,
    minPrice: null,
    maxPrice: null,
  };
};

export const toFallbackProduct = (item: StreamDetailItem): Product => ({
  itemId: item.itemId,
  status: item.status,
  name: item.name,
  description: item.description,
  tags: item.tags,
  images: item.images,
  startPrice: item.auctionType === 'BOTTOM_UP' ? item.bottomUp.startPrice : item.uniqueTop.minPrice,
  minPrice: item.auctionType === 'UNIQUE_TOP' ? item.uniqueTop.minPrice : null,
  maxPrice: item.auctionType === 'UNIQUE_TOP' ? item.uniqueTop.maxPrice : null,
  bidUnit: item.auctionType === 'BOTTOM_UP' ? item.bottomUp.bidUnit : 0,
  auctionDuration: item.auctionDuration,
  itemCondition: item.itemCondition,
  category: item.category,
  auctionType: item.auctionType,
  createdAt: item.createdAt,
});

export const toStreamAuctionItem = (item: Product): StreamAuctionItem =>
  item.auctionType === 'UNIQUE_TOP'
    ? {
        itemId: item.itemId,
        auctionType: 'UNIQUE_TOP',
        auctionDuration: item.auctionDuration ?? 0,
        bottomUp: null,
        uniqueTop: {
          minPrice: item.minPrice ?? item.startPrice ?? 0,
          maxPrice: item.maxPrice ?? item.startPrice ?? 0,
        },
      }
    : {
        itemId: item.itemId,
        auctionType: 'BOTTOM_UP',
        auctionDuration: item.auctionDuration ?? 0,
        bottomUp: {
          startPrice: item.startPrice ?? 0,
          bidUnit: item.bidUnit ?? 0,
        },
        uniqueTop: null,
      };
