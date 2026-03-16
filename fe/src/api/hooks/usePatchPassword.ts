import { useMutation } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';

type PatchPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

const patchPasswordPath = () => `/v1/users/me/password`;

export const usePatchPassword = () => {
  return useMutation({
    mutationFn: async (payload: PatchPasswordPayload) => {
      const response = await getFetchInstance().patch(patchPasswordPath(), payload);
      return response.data;
    },
  });
};
