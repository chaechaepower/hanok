import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, WalletWithdrawalPayload } from '@/types';

export const getWalletWithdrawalPath = () => '/v1/wallet/withdrawals';

export const createWalletWithdrawal = async (payload: WalletWithdrawalPayload) => {
  const response = await getFetchInstance().post<ApiResponse<null>>(getWalletWithdrawalPath(), payload);
  return response.data.data;
};

export const usePostWalletWithdrawal = () => {
  return useMutation({
    mutationFn: (payload: WalletWithdrawalPayload) => createWalletWithdrawal(payload),
    throwOnError: false,
  });
};
