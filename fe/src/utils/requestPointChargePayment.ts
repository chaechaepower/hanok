import {
  Locale,
  PaymentCurrency,
  PaymentPayMethod,
  requestPayment,
  type PaymentResponse,
} from '@portone/browser-sdk/v2';

const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID;
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;

export type RequestPointChargePaymentParams = {
  amount: number;
  orderName?: string;
  paymentId?: string | number;
};

export async function requestPointChargePayment({
  amount,
  orderName = `가상머니 ${amount.toLocaleString('ko-KR')}원 충전`,
  paymentId,
}: RequestPointChargePaymentParams): Promise<PaymentResponse | undefined> {
  if (amount <= 0) {
    throw new Error('충전 금액을 확인해주세요.');
  }

  if (!PORTONE_STORE_ID) {
    throw new Error('VITE_PORTONE_STORE_ID가 설정되지 않았습니다.');
  }

  if (!PORTONE_CHANNEL_KEY) {
    throw new Error('VITE_PORTONE_CHANNEL_KEY가 설정되지 않았습니다.');
  }

  return requestPayment({
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_CHANNEL_KEY,
    paymentId: String(paymentId),
    orderName,
    totalAmount: amount,
    currency: PaymentCurrency.KRW,
    payMethod: PaymentPayMethod.CARD,
    locale: Locale.KO_KR,
    customData: {
      source: 'wallet',
      chargeAmount: amount,
    },
  });
}
