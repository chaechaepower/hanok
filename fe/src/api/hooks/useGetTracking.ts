import { useQuery } from '@tanstack/react-query';
import type { TrackingResult, TrackingErrorResponse } from '@/types';

const SWEETTRACKER_API_KEY = import.meta.env.VITE_SWEETTRACKER_API_KEY as string;

const fetchTracking = async (courierCode: string, trackingNumber: string): Promise<TrackingResult> => {
  const params = new URLSearchParams({
    t_key: SWEETTRACKER_API_KEY,
    t_code: courierCode,
    t_invoice: trackingNumber,
  });

  const res = await fetch(`https://info.sweettracker.co.kr/api/v1/trackingInfo?${params.toString()}`);

  if (res.status === 404 || res.status === 500) {
    const errData: TrackingErrorResponse = await res.json();
    throw new Error(errData.msg || '배송 정보를 조회할 수 없습니다.');
  }

  const data = await res.json();

  if (data.code) {
    throw new Error(data.msg || '배송 정보를 조회할 수 없습니다.');
  }

  if (!data.trackingDetails?.length) {
    throw new Error('배송 정보가 아직 등록되지 않았습니다.');
  }

  return data as TrackingResult;
};

export const useGetTracking = (courierCode: string, trackingNumber: string) => {
  return useQuery({
    queryKey: ['tracking', courierCode, trackingNumber],
    queryFn: () => fetchTracking(courierCode, trackingNumber),
    enabled: !!courierCode && !!trackingNumber && !!SWEETTRACKER_API_KEY,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
