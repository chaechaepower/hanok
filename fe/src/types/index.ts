export type ApiResponse<T> = {
  status: string;
  message: string;
  data: T;
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

// ─── Escrow ───────────────────────────────────────────────────────────────────
export type EscrowState = 'DEPOSITED' | 'INVOICE_SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export type EscrowItem = {
  escrowId?: string | number;
  imageUrl?: string;
  itemName: string;
  amount: number;
  escrowState: EscrowState;
  createdAt: string;
};

export type EscrowListResponse = {
  status: string;
  message: string;
  data: EscrowItem[];
};

export type EscrowDetailResponse = {
  status: string;
  message: string;
  data: {
    winningInfo: {
      imageUrl?: string;
      itemName: string;
      finalPrice: number;
      sellerName: string;
      sellerId: string;
      wonAt: string;
    };
    shippingAddress: {
      name: string;
      phone: string;
      postalCode: string;
      address: string;
      addressDetail: string;
    };
    delivery: {
      courierName: string;
      trackingNumber: string;
    } | null;
  };
};

// ─── Tracking ─────────────────────────────────────────────────────────────────
export type PostTrackingInfoPayload = {
  carrierName: string;    // 택배사 이름 ("CJ대한통운" 등)
  trackingNumber: string; // 송장 번호
};

export type LiveSeller = {
  sellerId: number;
  nickname: string;
  profileImageUri: string | null;
};

export type LiveCardData = {
  streamId: number;
  title: string;
  category: string;
  thumbnailUri: string | null;
  isLive: boolean;
  viewerCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  seller: LiveSeller;
};

export type MainLiveResponse = {
  content: LiveCardData[];
  page: number;
  size: number;
  totalElements: number;
  hasNext: boolean;
};

// ─── Follow / Unfollow ────────────────────────────────────────────────────────
export type FollowPayload = {
  userId: number;
};

export type FollowResponse = {
  following: boolean;
  followerCount: number;
  followingCount: number;
};

// ─── Seller Reputation ────────────────────────────────────────────────────────
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
// ─── Seller Onboarding ───────────────────────────────────────────────────────
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

export type WalletResponse = {
  balance: number;
  depositedAuctionBalance: number;
};

export type WalletChargePayload = {
  amount: number;
};

export type WalletChargeResponse = {
  paymentId: string;
};

export type WalletWithdrawalPayload = {
  amount: number;
};

export type CompleteWalletChargePayload = {
  paymentId: string;
};

export type UserAccountResponse = {
  bankName: string;
  accountNumber: string;
};

export type TradeReportType = 'CHARGE' | 'WITHDRAW' | 'SETTLEMENT';

export type TradeReportItem = {
  itemName: string | null;
  amount: number;
  createdAt: string;
};

// ─── Bizno API ────────────────────────────────────────────────────────────────
export interface BiznoResponse {
  resultCode: number; // 0: 성공, 그 외 에러
  resultMsg: string;
  totalCount: number;
  items: Array<{
    bno: string; // 사업자등록번호
    company: string; // 상호명
    bstt: string; // 사업자상태 (계속사업자, 휴업, 폐업 등)
    taxtype: string; // 과세유형
  } | null>;
}


// ─── Seller Profile ───────────────────────────────────────────────────────────
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

// ─── Seller Notice ───────────────────────────────────────────────────────────
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

// ─── Auction ──────────────────────────────────────────────────────────────────
export type AuctionDuration = 10 | 30 | 60;

export type TimerPhase = "normal" | "urgent" | "ended";

// ─── Stream ──────────────────────────────────────────────────────────────────
export type StreamState = "live" | "disconnected" | "ended";

// ─── Chat ─────────────────────────────────────────────────────────────────────
export type ChatMessageType =
  | { id: number; type: "chat"; nickname: string; message: string }
  | { id: number; type: "macro_request"; nickname: string; command: string }
  | { id: number; type: "macro_response"; label: string; message: string }
  | { id: number; type: "system"; message: string };

