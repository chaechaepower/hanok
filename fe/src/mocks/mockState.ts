export type MockLoginUser = {
  userId: number;
  email: string;
  phone: string;
  password: string;
  nickname: string;
  profileImage: string | null;
  balance: number;
  depositedBalance: number;
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
    nickname: '구매자테스트',
    profileImage: 'https://api.dicebear.com/7.x/adventurer/svg?seed=buyer',
    balance: 10000,
    depositedBalance: 5000,
    isSeller: false,
    accessToken: 'mock-access-token-buyer',
    refreshToken: 'mock-refresh-token-buyer',
  },
  {
    userId: 2,
    email: 'seller@example.com',
    phone: '010-2222-3333',
    password: 'password123',
    nickname: '판매자테스트',
    profileImage: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller',
    balance: 30000,
    depositedBalance: 12000,
    isSeller: true,
    accessToken: 'mock-access-token-seller',
    refreshToken: 'mock-refresh-token-seller',
  },
  {
    userId: 3,
    email: 'testuser@example.com',
    phone: '010-3333-4444',
    password: 'test1234',
    nickname: '테스트유저',
    profileImage: 'https://api.dicebear.com/7.x/adventurer/svg?seed=test-user',
    balance: 50000,
    depositedBalance: 15000,
    isSeller: false,
    accessToken: 'mock-access-token-test-user',
    refreshToken: 'mock-refresh-token-test-user',
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
