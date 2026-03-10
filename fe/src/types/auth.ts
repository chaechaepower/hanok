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

export type LogoutPayload = {
  refreshToken: string;
};

export type LogoutResponse = {
  success: boolean;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type SignUpPayload = {
  email: string;
  nickname: string;
  password: string;
  phone: string;
  smsToken: string;
};

export type CheckEmailResponse = {
  isDuplicated: boolean;
};

export type SmsCodeResponse = {
  expireAt: string;
};

export type VerifySmsResponse = {
  verified: boolean;
  sessionToken: string;
};
