import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { WithdrawPayload, WithdrawResponse } from '@/types';

export const getWithdrawPath = () => '/v1/users/me/withdraw';

export const deleteWithdraw = async (payload: WithdrawPayload) => {
  const response = await getFetchInstance().delete<WithdrawResponse>(getWithdrawPath(), {
    data: payload,
  });
  return response.data;
};

export const useDeleteWithdraw = () => {
  return useMutation({
    mutationFn: deleteWithdraw,
    throwOnError: false,
  });
};
