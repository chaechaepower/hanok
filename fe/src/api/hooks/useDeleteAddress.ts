import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';

export const deleteAddressPath = (id: number) => `/v1/users/me/addresses/${id}`;

export const deleteAddress = async (id: number) => {
  const response = await getFetchInstance().delete(deleteAddressPath(id));
  return response.data;
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
