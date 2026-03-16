import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';

export const patchNotificationReadPath = (notifId: number) => `/v1/notifications/${notifId}/read`;

export const patchNotificationRead = async (notifId: number) => {
  const response = await getFetchInstance().patch(patchNotificationReadPath(notifId));
  return response.data;
};

export const usePatchNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};
