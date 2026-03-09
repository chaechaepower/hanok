import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, WalletChargePayload, WalletChargeResponse } from '@/types';

export const getWalletChargePath = () => '/v1/wallet/charges';

export const createWalletCharge = async (payload: WalletChargePayload) => {
  const response = await getFetchInstance().post<ApiResponse<WalletChargeResponse>>(getWalletChargePath(), payload);
  return response.data.data;
};

export const usePostWalletCharge = () => {
  return useMutation({
    mutationFn: (payload: WalletChargePayload) => createWalletCharge(payload),
    throwOnError: false,
  });
};
