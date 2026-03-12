import { useMutation } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, IdentityVerificationData } from '@/types';

export const postIdentityVerification = async (identityVerificationId: string) => {
  const response = await getFetchInstance().post<ApiResponse<IdentityVerificationData>>(
    '/v1/auth/identity-verification',
    { identityVerificationId },
  );
  return response.data;
};

export const usePostIdentityVerification = () => {
  return useMutation({
    mutationFn: (identityVerificationId: string) =>
      postIdentityVerification(identityVerificationId),
    throwOnError: false,
  });
};
