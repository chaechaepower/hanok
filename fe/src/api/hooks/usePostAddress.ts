import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { CreateAddressPayload } from '@/types';

export const postAddressPath = () => '/v1/users/me/addresses';

export const postAddress = async (payload: CreateAddressPayload) => {
  const response = await getFetchInstance().post(postAddressPath(), payload);
  return response.data;
};

export const usePostAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
