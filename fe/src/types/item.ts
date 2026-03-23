export type ItemAuctionType = 'BOTTOM_UP' | 'UNIQUE_TOP';

export type CreateItemPayload = {
  name: string;
  description: string;
  category: string;
  itemCondition: string;
  tags?: string[];
  images?: File[];
};

export type CreateItemResponse = {
  itemId: number;
  name: string;
  status: string;
};

export type UpdateItemPayload = Omit<CreateItemPayload, 'images'> & {
  images: [string | null, string | null, string | null];
  image1?: File;
  image2?: File;
  image3?: File;
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

export type ProductStatus = 'READY' | 'SCHEDULED' | 'PENDING' | 'INTRODUCING' | 'LIVE' | 'SOLD' | 'UNSOLD';

export interface Product {
  itemId: number;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  startPrice?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  bidUnit?: number;
  auctionDuration?: number;
  itemCondition: string;
  category: string;
  auctionType?: ItemAuctionType;
  status: ProductStatus;
  createdAt?: string;
}
