export type WalletResponse = {
  balance: number;
  depositedAuctionBalance: number;
};

export type WalletChargePayload = {
  amount: number;
};

export type WalletChargeResponse = {
  paymentId: string;
};

export type WalletWithdrawalPayload = {
  amount: number;
};

export type CompleteWalletChargePayload = {
  paymentId: string;
};

export type UserAccountResponse = {
  bankName: string;
  accountNum: string;
  accountName: string;
};

export type TradeReportType = 'CHARGE' | 'WITHDRAW' | 'SETTLEMENT';

export type TradeReportItem = {
  itemName: string | null;
  amount: number;
  createdAt: string;
};
