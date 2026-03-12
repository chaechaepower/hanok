// ─── User Settings / Me ───────────────────────────────────────────────────────
export type GetMeResponse = {
  email: string;
  nickname: string;
  profileImage: string | null;
  phone: string;
  balance: number;
  depositedBalance: number;
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
  followStreamAlert: boolean;
};

export type PatchNotificationPayload = {
  followStreamAlert: boolean;
};

export type PatchNotificationResponse = {
  followStreamAlert: boolean;
};

// ─── User / Withdraw ──────────────────────────────────────────────────────────
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

// ─── Following List ──────────────────────────────────────────────────────────
export type FollowingSeller = {
  sellerId: number;
  nickname: string;
  profileImageUri: string | null;
  rating: number;
  isLive: boolean;
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

// ─── Shipping Address ─────────────────────────────────────────────────────────
export type Address = {
  id: number;
  label: string;
  isDefault: boolean;
  name: string;
  zipCode: string;
  address: string;
  phone: string;
};

export type GetAddressesResponse = {
  addresses: Address[];
};

export type AddressFormState = {
  label: string;
  name: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  phone: string;
};

export type AddressModalMode = 'add' | 'edit';

export type CreateAddressPayload = {
  label: string;
  name: string;
  zipCode: string;
  address: string;
  phone: string;
};

export type UpdateAddressPayload = {
  label: string;
  name: string;
  zipCode: string;
  address: string;
  phone: string;
};

export type SetDefaultAddressPayload = {
  isDefault: boolean;
};
