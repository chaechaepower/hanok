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
