import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { FollowPayload, FollowResponse } from '@/types';

export const patchFollowPath = (userId: string | number) => `/v1/users/${userId}/follow`;

export const patchFollow = async (req: FollowPayload): Promise<FollowResponse> => {
  const response = await getFetchInstance().patch<FollowResponse>(patchFollowPath(req.userId), req);
  return response.data;
};

export const usePatchFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchFollow,
    onSuccess: (_, variables) => {
      // 팔로우 처리 성공 시 판매자 평판 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['sellerReputation', variables.userId] });
    },
  });
};
