export type SellerReputationData = {
  followerCount: number;
  totalTrades?: number;
  completionRate?: number;
  cancelCount?: number;
  avgShipDays?: number;
};

export type BusinessType = 'INDIVIDUAL' | 'BUSINESS';

export type RegisterAccountPayload = {
  bankCode: string;
  accountNum: string;
  accountName: string;
};

export type RegisterAccountResponse = unknown;

export type RegisterSellerPayload = {
  type: BusinessType;
  businessNumber: string | null;
  shopName: string;
  intro: string;
  youtubeUrl: string;
  instaUrl: string;
  tiktokUrl: string;
  bankCode: string;
  accountNum: string;
  accountName: string;
};

export type RegisterSellerResponse = {
  sellerId: number;
  shopName: string;
};

export type SellerStatusResponse = {
  isSeller: boolean;
  sellerId: number | null;
};

export type SellerRankingItem = {
  rank: number;
  sellerId: number;
  shopName: string;
  profileImage: string | null;
  followerCount: number;
};

export type SellerProfileStats = {
  rating: number;
  avgShipDays: number;
  followerCount: number;
};

export type SellerRecentSale = {
  itemId: number;
  title: string;
  finalPrice: number;
  soldAt: string;
};

export type SellerPost = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string;
  scheduledAt: string;
  state: string;
};

export type SellerProfileResponse = {
  sellerId: number;
  shopName: string;
  intro: string;
  profileImage: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  stats: SellerProfileStats;
  recentSales: SellerRecentSale[];
  posts: SellerPost[];
};

export type SearchSellerResult = {
  sellerId: number;
  shopName: string;
  profileImage: string | null;
  intro: string;
  rating: number;
  isFollowed: boolean;
};

export type NoticeItem = {
  noticeId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PostSellerNoticePayload = {
  title: string;
  content: string;
};

export type PostSellerNoticeResponse = {
  noticeId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PatchSellerProfilePayload = {
  shopName?: string;
  profileImage?: string;
  intro?: string;
  instaUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
};

export type PatchSellerNoticePayload = {
  title?: string;
  content?: string;
};

export type PatchSellerNoticeResponse = {
  noticeId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
