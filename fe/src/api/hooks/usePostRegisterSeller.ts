import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { RegisterSellerPayload, RegisterSellerResponse } from '@/types';

export const getRegisterSellerPath = () => `/v1/sellers/register`;

export const registerSeller = async (payload: RegisterSellerPayload) => {
  const response = await getFetchInstance().post<RegisterSellerResponse>(
    getRegisterSellerPath(),
    payload,
  );
  return response.data;
};

export const useRegisterSeller = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterSellerPayload) => registerSeller(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-status'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    throwOnError: false,
  });
};
