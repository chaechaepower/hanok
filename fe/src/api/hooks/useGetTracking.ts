import { useQuery } from '@tanstack/react-query';

import type { TrackingErrorResponse, TrackingResult } from '@/types';

const SWEETTRACKER_API_KEY = import.meta.env.VITE_SWEETTRACKER_API_KEY as string;

type FetchTrackingOptions = {
  allowEmptyTrackingDetails?: boolean;
};

const fetchTracking = async (
  carrierCode: string,
  trackingNumber: string,
  options: FetchTrackingOptions = {},
): Promise<TrackingResult> => {
  const { allowEmptyTrackingDetails = false } = options;
  const params = new URLSearchParams({
    t_key: SWEETTRACKER_API_KEY,
    t_code: carrierCode,
    t_invoice: trackingNumber,
  });

  const response = await fetch(`https://info.sweettracker.co.kr/api/v1/trackingInfo?${params.toString()}`);

  if (response.status === 404 || response.status === 500) {
    const errorData: TrackingErrorResponse = await response.json();
    throw new Error(errorData.msg || '운송장 조회 중 오류가 발생했습니다.');
  }

  const data = await response.json();

  if (data.code) {
    throw new Error(data.msg || '유효하지 않은 운송장번호이거나 택배사 코드입니다.');
  }

  if (!allowEmptyTrackingDetails && !data.trackingDetails?.length) {
    throw new Error('배송 추적 정보가 아직 준비되지 않았습니다.');
  }

  return data as TrackingResult;
};

export const validateTrackingInput = async (carrierCode: string, trackingNumber: string) => {
  await fetchTracking(carrierCode, trackingNumber, { allowEmptyTrackingDetails: true });
};

export const useGetTracking = (carrierCode: string, trackingNumber: string, enabled = true) => {
  return useQuery({
    queryKey: ['tracking', carrierCode, trackingNumber],
    queryFn: () => fetchTracking(carrierCode, trackingNumber),
    enabled: enabled && !!carrierCode && !!trackingNumber && !!SWEETTRACKER_API_KEY,
    staleTime: 1000 * 60 * 5,
    retry: false,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });
};
