import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse,PatchNotificationPayload, PatchNotificationResponse } from '@/types';

export const getPatchNotificationPath = () => '/v1/users/me/notification';

export const patchNotification = async (payload: PatchNotificationPayload) => {
  const response = await getFetchInstance().patch<ApiResponse<PatchNotificationResponse>>(

    getPatchNotificationPath(),
    payload
  );
  return response.data.data;
};

export const usePatchNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'notification'] });
    },
  });
};
