export type CreateItemPayload = {
  title: string;
  description: string;
  newImages: File[];
  startPrice: number;
  auctionDuration: number;
  bidUnit: number;
  categoryId: number;
  condition?: string;
  auctionMethod?: string;
  tags?: string[];
};

export type CreateItemResponse = {
  itemId: number;
  title: string;
  status: string;
};

export type UpdateItemPayload = {
  title: string;
  description: string;
  existingImageUrls: string[];
  newImages: File[];
  startPrice?: number;
  bidUnit?: number;
  auctionDuration?: number;
  categoryId?: number;
  condition?: string;
  auctionMethod?: string;
  tags?: string[];
};

export type UpdateItemResponse = {
  itemId: number;
  title: string;
  status: string;
};

export type DeleteItemResponse = {
  itemId: number;
  status: string;
};

export type ProductStatus = 'WAITING' | 'AUCTION' | 'SOLD';

export interface Product {
  id: number;
  status: ProductStatus;
  title: string;
  description: string;
  tags: string[];
  imageUrls: string[];
  startPrice: number;
  bidUnit: number;
  auctionTime: number;
  condition: string;
  category: string;
  auctionMethod: string;
}
