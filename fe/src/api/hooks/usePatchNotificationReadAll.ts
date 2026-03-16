import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';

export const patchNotificationReadAll = async () => {
  const response = await getFetchInstance().patch('/v1/notifications/read-all');
  return response.data;
};

export const usePatchNotificationReadAll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchNotificationReadAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};
