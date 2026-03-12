import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { UpdateAddressPayload, SetDefaultAddressPayload } from '@/types';

export const patchAddressPath = (id: number) => `/v1/users/me/addresses/${id}`;

export const patchAddress = async (id: number, payload: UpdateAddressPayload | SetDefaultAddressPayload) => {
  const response = await getFetchInstance().patch(patchAddressPath(id), payload);
  return response.data;
};

export const usePatchAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: (UpdateAddressPayload | SetDefaultAddressPayload) & { id: number }) =>
      patchAddress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
