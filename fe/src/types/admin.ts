export type WithdrawStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export type WithdrawItem = {
  id: number;
  userId: number;
  accountName: string;
  bankCode: string;
  accountNum: string;
  amount: number;
  status: WithdrawStatus;
  requestedAt: string;
  processedAt: string | null;
};
