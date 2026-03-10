export type SellerReputationData = {
  followerCount: number;
  totalTrades?: number;
  completionRate?: number;
  cancelCount?: number;
  avgShipDays?: number;
};

export type SellerReputationResponse = {
  status: string;
  message: string;
  data: SellerReputationData;
};

export type BusinessType = 'individual' | 'corporate';

export type RegisterAccountPayload = {
  bankName: string;
  accountNum: string;
  accountName: string;
};

export type RegisterAccountResponse = unknown;

export type RegisterSellerPayload = {
  type: BusinessType;
  businessNumber: string | null;
  nickname: string;
  intro: string;
  youtube_link: string;
  insta_link: string;
  tictok_link: string;
};

export type RegisterSellerResponse = {
  sellerId: number;
  nickname: string;
  grade: string;
};

export type SellerStatusResponse = {
  isSeller: boolean;
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
  postId: number;
  title: string;
  context: string;
  createdAt: string;
};

export type SellerProfileResponse = {
  sellerId: number;
  nickname: string;
  intro: string;
  profile_image: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  stats: SellerProfileStats;
  recentSales: SellerRecentSale[];
  posts: SellerPost[];
};

export type GetSellerNoticeParams = {
  page: number;
  limit: number;
};

export type NoticeItem = {
  postId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

export type GetSellerNoticeResponse = {
  items: NoticeItem[];
  total: number;
};

export type PostSellerNoticePayload = {
  title: string;
  content: string;
};

export type PostSellerNoticeResponse = {
  postId: number;
  title: string;
  content: string;
  createdAt: string;
};

export type PatchSellerNoticePayload = {
  title?: string;
  content?: string;
};

export type PatchSellerNoticeResponse = {
  postId: number;
  title: string;
  content: string;
  updatedAt: string;
};

export type DeleteSellerNoticeResponse = {
  success: boolean;
};
