import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { BiznoVerifyResponse, BusinessType } from '@/types';

export const getCheckBusinessPath = () => `/v1/sellers/verify-bizno`;

/**
 * @param businessNumber
 * @returns
 */
export const checkBusinessStatus = async (businessNumber: string, businessType: BusinessType): Promise<boolean> => {
  const response = await getFetchInstance().get<BiznoVerifyResponse>(getCheckBusinessPath(), {
    params: {
      bizno: businessNumber,
      gb: businessType === 'BUSINESS' ? 2 : 1,
    },
  });

  return response.data.valid;
};

export const useCheckBusinessStatus = () => {
  return useMutation({
    mutationFn: ({ businessNumber, businessType }: { businessNumber: string; businessType: BusinessType }) =>
      checkBusinessStatus(businessNumber, businessType),
    throwOnError: false,
  });
};
