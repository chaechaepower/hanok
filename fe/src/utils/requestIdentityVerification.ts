import { requestIdentityVerification as portoneRequestIdentityVerification } from '@portone/browser-sdk/v2';

const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID;
const PORTONE_IDENTITY_CHANNEL_KEY = import.meta.env.VITE_PORTONE_IDENTITY_CHANNEL_KEY;

export async function requestIdentityVerification() {
  const identityVerificationId = `identity-verification-${crypto.randomUUID()}`;

  if (!PORTONE_STORE_ID) {
    throw new Error('VITE_PORTONE_STORE_ID가 설정되지 않았습니다.');
  }
  if (!PORTONE_IDENTITY_CHANNEL_KEY) {
    throw new Error('VITE_PORTONE_IDENTITY_CHANNEL_KEY가 설정되지 않았습니다.');
  }

  const response = await portoneRequestIdentityVerification({
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_IDENTITY_CHANNEL_KEY,
    identityVerificationId,
  });

  if (!response || response.code) {
    throw new Error(response?.message ?? '본인인증에 실패했습니다.');
  }

  return response.identityVerificationId;
}
