import type { StreamEnterResponse } from '@/types';

const DEFAULT_PAUSED_SECONDS = 300;

export const getPausedInitialSeconds = (streamEnter: StreamEnterResponse | null) => {
  if (streamEnter?.status === 'PAUSED' && typeof streamEnter.remainingSeconds === 'number') {
    return streamEnter.remainingSeconds;
  }

  return DEFAULT_PAUSED_SECONDS;
};
