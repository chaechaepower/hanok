import type { AuctionDuration } from '@/types';

export const DURATION_OPTIONS: AuctionDuration[] = [10, 30, 60];

export const DURATION_LABELS: Record<AuctionDuration, string> = {
  10: '10초',
  30: '30초',
  60: '1분',
};

export const TIMER_URGENT_THRESHOLD = 5;
