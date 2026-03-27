import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession, getFetchInstance } from '../instance';
import type { FollowPayload, FollowResponse } from '@/types';

export const postFollowPath = (targetSellerId: number) => `/v1/follow/${targetSellerId}`;

export const postFollow = async (req: FollowPayload): Promise<FollowResponse> => {
  const response = await getFetchInstance().post<FollowResponse>(postFollowPath(req.targetSellerId));
  return response.data;
};

export const usePostFollow = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: postFollow,
    throwOnError: false,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sellerReputation', variables.targetSellerId] });
      queryClient.invalidateQueries({ queryKey: ['liveCards'] });
      queryClient.invalidateQueries({ queryKey: ['followedStores'] });
      queryClient.invalidateQueries({ queryKey: ['searchSellers'] });
      queryClient.invalidateQueries({ queryKey: ['sellerRanking'] });
      queryClient.invalidateQueries({ queryKey: ['sellerProfile', variables.targetSellerId] });
    },
  });

  const redirectToLoginIfNeeded = useCallback(() => {
    if (localStorage.getItem('accessToken')) {
      return false;
    }

    clearAuthSession({ redirectToLogin: false });
    navigate('/login', {
      replace: true,
      state: {
        toast: {
          type: 'warning',
          message: '로그인이 필요합니다.',
        },
      },
    });

    return true;
  }, [navigate]);

  const mutate: typeof mutation.mutate = useCallback(
    (variables, options) => {
      if (redirectToLoginIfNeeded()) {
        return;
      }

      mutation.mutate(variables, options);
    },
    [mutation, redirectToLoginIfNeeded],
  );

  const mutateAsync: typeof mutation.mutateAsync = useCallback(
    async (variables, options) => {
      if (redirectToLoginIfNeeded()) {
        return Promise.reject(new Error('Authentication is required to follow a seller.'));
      }

      return mutation.mutateAsync(variables, options);
    },
    [mutation, redirectToLoginIfNeeded],
  );

  return {
    ...mutation,
    mutate,
    mutateAsync,
  };
};
