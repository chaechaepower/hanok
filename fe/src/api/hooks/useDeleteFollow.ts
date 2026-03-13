import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { FollowPayload, FollowResponse } from '@/types';

import { getFetchInstance } from '../instance';

export const deleteFollowPath = (userId: string | number) => `/v1/users/${userId}/unfollow`;

export const deleteFollow = async (req: FollowPayload): Promise<FollowResponse> => {
  const response = await getFetchInstance().delete<FollowResponse>(deleteFollowPath(req.userId), { data: req });
  return response.data;
};

export const useDeleteFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFollow,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sellerReputation', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['liveCards'] });
      queryClient.invalidateQueries({ queryKey: ['followedStores'] });
    },
  });
};
