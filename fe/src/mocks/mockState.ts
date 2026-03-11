import type { LoginResponse } from '@/types';

export type MockLoginUser = LoginResponse['user'] & {
  password: string;
  isSeller: boolean;
  accessToken: string;
  refreshToken: string;
};

export const mockLoginUsers: MockLoginUser[] = [
  {
    userId: 1,
    email: 'buyer@example.com',
    phone: '010-1111-2222',
    password: 'password123',
    isSeller: false,
    accessToken: 'mock-access-token-buyer',
    refreshToken: 'mock-refresh-token-buyer',
  },
  {
    userId: 2,
    email: 'seller@example.com',
    phone: '010-2222-3333',
    password: 'password123',
    isSeller: true,
    accessToken: 'mock-access-token-seller',
    refreshToken: 'mock-refresh-token-seller',
  },
];

let currentMockUser: MockLoginUser | null = null;
let mockFollowerCount = 342;

export const getCurrentMockUser = () => currentMockUser;

export const setCurrentMockUser = (user: MockLoginUser | null) => {
  currentMockUser = user;
};

export const clearCurrentMockUser = () => {
  currentMockUser = null;
};

export const getMockFollowerCount = () => mockFollowerCount;

export const incrementMockFollowerCount = () => {
  mockFollowerCount += 1;
  return mockFollowerCount;
};

export const decrementMockFollowerCount = () => {
  mockFollowerCount = Math.max(0, mockFollowerCount - 1);
  return mockFollowerCount;
};
