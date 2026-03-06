// ─── Example ──────────────────────────────────────────────────────────────────
export type ExData = {
  id: number;
  name: string;
};

// ─── Auth / SignUp ────────────────────────────────────────────────────────────
export type SignUpPayload = {
  email: string;
  nickname: string;
  password: string;
  phone: string;
  smsToken: string;
};

// ─── Seller Onboarding ───────────────────────────────────────────────────────
export type BusinessType = 'individual' | 'corporate';

export type RegisterSellerPayload = {
  type: BusinessType;
  businessNumber: string | null;
  accountId: number;
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

