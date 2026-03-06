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

// ─── Bizno API ────────────────────────────────────────────────────────────────
export interface BiznoResponse {
  resultCode: number; // 0: 성공, 그 외 에러
  resultMsg: string;
  totalCount: number;
  items: Array<{
    bno: string;      // 사업자등록번호
    company: string;   // 상호명
    bstt: string;      // 사업자상태 (계속사업자, 휴업, 폐업 등)
    taxtype: string;   // 과세유형
  } | null>;
}
