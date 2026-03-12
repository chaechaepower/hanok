export type ApiResponse<T = Record<string, never>> = {
  status: string;
  message: string;
  data: T;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponseData = {
  accessToken: string;
  refreshToken: string;
};

export type SignUpPayload = {
  email: string;
  nickname: string;
  password: string;
  phone: string;
};

export type SignUpResponseData = {
  userId: number;
  email: string;
  nickname: string;
};

export type IdentityVerificationRequest = {
  identityVerificationId: string;
};

export type IdentityVerificationData = {
  name: string;
  phoneNumber: string;
  birthDate: string;
};
