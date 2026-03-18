export type GetMeResponse = {
  email: string;
  nickname: string;
  profileImage: string | null;
  phone: string;
  balance: number;
  depositedBalance: number;
  bankCode: string;
  accountName: string;
  accountNum: string;
  sellerId: number | null;
};

export type PatchMeSettingsPayload = {
  email?: string;
  phone?: string;
  nickname?: string;
  profileImage?: string;
};

export type PatchMeSettingsResponse = {
  userId: number;
  email: string;
  phone: string;
  updatedAt: string;
};

export type GetNotificationResponse = {
  notificationSetting: boolean;
};

export type PatchNotificationPayload = {
  notificationSetting: boolean;
};

export type PatchNotificationResponse = {
  notificationSetting: boolean;
};

export type PatchPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type WithdrawPayload = {
  password: string;
};

export type WithdrawResponse = {
  status: string;
  message: string;
  data: {
    status: string;
  };
};

export type FollowingSeller = {
  sellerId: number;
  nickname: string;
  profileImageUri: string | null;
  rating: number;
};

export type FollowingItem = {
  followId: number;
  seller: FollowingSeller;
  followedAt: string;
};

export type GetFollowingResponse = {
  content: FollowingItem[];
  page: number;
  size: number;
  totalElements: number;
  hasNext: boolean;
};

export type Address = {
  id: number;
  addressName: string;
  postalCode: number;
  address: string;
  addressDetail: string;
  phone: string;
  recipientName: string;
  isDefault: boolean;
};

export type GetAddressesResponse = Address[];

export type AddressFormState = {
  addressName: string;
  recipientName: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  phone: string;
};

export type AddressModalMode = 'add' | 'edit';

export type CreateAddressPayload = {
  addressName: string;
  postalCode: number;
  address: string;
  addressDetail: string;
  phone: string;
  recipientName: string;
  isDefault: boolean;
};

export type UpdateAddressPayload = {
  addressName: string;
  postalCode: number;
  address: string;
  addressDetail: string;
  phone: string;
  recipientName: string;
  isDefault: boolean;
};

export type AccountData = {
  bankCode: string;
  accountNum: string;
  accountName: string;
};

export type JusoResult = {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  bdNm: string;
  siNm: string;
  sggNm: string;
  emdNm: string;
};
