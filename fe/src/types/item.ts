export type ItemAuctionType = 'BOTTOM_UP' | 'UNIQUE_TOP';

export type CreateItemPayload = {
  name: string;
  description: string;
  category: string;
  startPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  bidUnit: number | null;
  auctionDuration: number;
  itemCondition: string;
  auctionType: ItemAuctionType;
  tags?: string[];
  images?: File[];
};

export type CreateItemResponse = {
  itemId: number;
  name: string;
  status: string;
};

export type UpdateItemPayload = {
  name?: string;
  description?: string;
  category?: string;
  startPrice?: number;
  bidUnit?: number;
  auctionDuration?: number;
  itemCondition?: string;
  tags?: string[];
  images?: File[];
};

export type UpdateItemResponse = {
  itemId: number;
  name: string;
  status: string;
};

export type DeleteItemResponse = {
  itemId: number;
  status: string;
};

export type ProductStatus = 'READY' | 'SCHEDULED' | 'PENDING' | 'SOLD';

export interface Product {
  itemId: number;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  startPrice: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  bidUnit: number;
  auctionDuration: number;
  itemCondition: string;
  category: string;
  auctionType: ItemAuctionType;
  status: ProductStatus;
  createdAt?: string;
}
