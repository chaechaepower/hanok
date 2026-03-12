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
};

export type SignUpResponse = {
  status: string;
  message: string;
  data: {
    userId: number;
    email: string;
    nickname: string;
  };
};

export type CheckEmailResponse = {
  isDuplicated: boolean;
};

export type IdentityVerificationRequest = {
  identityVerificationId: string;
};

export type IdentityVerificationData = {
  name: string;
  phoneNumber: string;
  birthDate: string;
};

export type IdentityVerificationResponse = {
  status: 'SUCCESS' | 'FAIL';
  data: IdentityVerificationData;
};
