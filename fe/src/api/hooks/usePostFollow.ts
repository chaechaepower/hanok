import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { FollowPayload, FollowResponse } from '@/types';

export const postFollowPath = (targetSellerId: number) => `/v1/follow/${targetSellerId}`;

export const postFollow = async (req: FollowPayload): Promise<FollowResponse> => {
  const response = await getFetchInstance().post<FollowResponse>(postFollowPath(req.targetSellerId));
  return response.data;
};

export const usePostFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postFollow,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sellerReputation', variables.targetSellerId] });
      queryClient.invalidateQueries({ queryKey: ['liveCards'] });
      queryClient.invalidateQueries({ queryKey: ['followedStores'] });
      queryClient.invalidateQueries({ queryKey: ['sellerProfile', variables.targetSellerId] });
    },
  });
};
