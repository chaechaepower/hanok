import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { CompleteWalletChargePayload } from '@/types';

export const getCompleteWalletChargePath = () => '/v1/wallet/charges/complete';

export const completeWalletCharge = async (payload: CompleteWalletChargePayload) => {
  const response = await getFetchInstance().post(getCompleteWalletChargePath(), payload);
  return response.data;
};

export const usePostCompleteWalletCharge = () => {
  return useMutation({
    mutationFn: (payload: CompleteWalletChargePayload) => completeWalletCharge(payload),
    throwOnError: false,
  });
};
