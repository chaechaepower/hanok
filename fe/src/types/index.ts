// ─── Example ──────────────────────────────────────────────────────────────────
export type ExData = {
  id: number;
  name: string;
};

// ─── Auth / Login ─────────────────────────────────────────────────────────────
export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: number;
    email: string;
    phone: string;
  };
};

// ─── Auth / Logout ────────────────────────────────────────────────────────────
export type LogoutPayload = {
  refreshToken: string;
};

export type LogoutResponse = {
  success: boolean;
};

// ─── Auth / Token Refresh ─────────────────────────────────────────────────────
export type RefreshTokenPayload = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

// ─── Auth / Sign Up ───────────────────────────────────────────────────────────
export type SignUpPayload = {
  email: string;
  nickname: string;
  password: string;
  phone: string;
  smsToken: string;
};

// ─── Auth / Email ─────────────────────────────────────────────────────────────
export type CheckEmailResponse = {
  isDuplicated: boolean;
};

// ─── Auth / SMS ───────────────────────────────────────────────────────────────
export type SmsCodeResponse = {
  expireAt: string;
};

export type VerifySmsResponse = {
  verified: boolean;
  sessionToken: string;
};

export type SideBarItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

// ─── Item (Product) CRUD ──────────────────────────────────────────────────────
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

// ─── Product ──────────────────────────────────────────────────────────────────
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
  auctionTime: number; // in seconds
  condition: string;
  category: string;
  auctionMethod: string;
}
