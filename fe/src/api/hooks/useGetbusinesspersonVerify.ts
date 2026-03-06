import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import type { BiznoResponse, BusinessType } from '@/types';

export const getCheckBusinessPath = () => `/bizno-api`;

/**
 * @param businessNumber
 * @returns
 */
export const checkBusinessStatus = async (businessNumber: string, businessType: BusinessType): Promise<boolean> => {
  const API_KEY = import.meta.env.VITE_BIZNO_API_KEY;

  const response = await axios.get<BiznoResponse>(
    getCheckBusinessPath(),
    {
      params: {
        key: API_KEY,
        gb: businessType === 'corporate' ? 2 : 1,
        q: businessNumber,
        type: 'json',
      },
    }
  );
  
  const data = response.data;
  if (!data || data.resultCode !== 0 || data.totalCount === 0) {
    return false;
  }
  
  const firstItem = data.items[0];
  if (!firstItem || !firstItem.bstt || !firstItem.bstt.includes('계속사업자')) {
    return false;
  }
  
  return true;
};

export const useCheckBusinessStatus = () => {
  return useMutation({
    mutationFn: ({ businessNumber, businessType }: { businessNumber: string, businessType: BusinessType }) => checkBusinessStatus(businessNumber, businessType),
    throwOnError: false, // Prevent React Query from bubbling network errors to Error Boundary and crashing the App
  });
};