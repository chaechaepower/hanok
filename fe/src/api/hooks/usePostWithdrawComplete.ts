import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse } from '@/types';

export const postWithdrawCompletePath = (withdrawId: number) =>
  `/v1/admin/withdraws/${withdrawId}/complete`;

export const postWithdrawComplete = async (withdrawId: number) => {
  const response = await getFetchInstance().post<ApiResponse<unknown>>(
    postWithdrawCompletePath(withdrawId),
  );
  return response.data;
};

export const usePostWithdrawComplete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (withdrawId: number) => postWithdrawComplete(withdrawId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdraws'] });
    },
  });
};
