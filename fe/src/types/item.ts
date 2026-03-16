export type CreateItemPayload = {
  name: string;
  description: string;
  category: string;
  startPrice: number;
  bidUnit: number;
  auctionDuration: number;
  itemCondition: string;
  auctionType: string;
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

export type ProductStatus = 'READY' | 'PENDING' | 'SOLD';

export interface Product {
  itemId: number;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  startPrice: number;
  bidUnit: number;
  auctionDuration: number;
  itemCondition: string;
  category: string;
  auctionType: string;
  status: ProductStatus;
  createdAt?: string;
}
