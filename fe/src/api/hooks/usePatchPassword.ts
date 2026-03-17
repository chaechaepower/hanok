import { useMutation } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { PatchPasswordPayload } from '@/types/settings';

const patchPasswordPath = () => `/v1/users/me/password`;

export const usePatchPassword = () => {
  return useMutation({
    mutationFn: async (payload: PatchPasswordPayload) => {
      const response = await getFetchInstance().patch(patchPasswordPath(), payload);
      return response.data;
    },
  });
};
