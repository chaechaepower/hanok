import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFetchInstance } from '../instance';
import type { ApiResponse,FollowPayload, FollowResponse } from '@/types';

export const postFollowPath = (userId: string | number) => `/v1/users/${userId}/follow`;

export const postFollow = async (req: FollowPayload): Promise<FollowResponse> => {
  const response = await getFetchInstance().post<ApiResponse<FollowResponse>>(postFollowPath(req.userId), req);
  return response.data.data;
};

export const usePostFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postFollow,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sellerReputation', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['liveCards'] });
      if (data.following) {
        queryClient.invalidateQueries({ queryKey: ['followedStores'] });
      }
    },
  });
};
