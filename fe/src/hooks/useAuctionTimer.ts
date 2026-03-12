import { useEffect, useEffectEvent, useState } from 'react';

import { TIMER_URGENT_THRESHOLD } from '@/constants/auction';
import type { SyncedAuctionTimer, TimerPhase } from '@/types';

interface UseAuctionTimerOptions {
  timer: SyncedAuctionTimer;
  onExpire: () => void;
}

interface UseAuctionTimerReturn {
  secondsLeft: number;
  phase: TimerPhase;
  displayValue: string;
  displaySize: 'sm' | 'md' | 'lg';
}

const getPhase = (secondsLeft: number): TimerPhase => {
  if (secondsLeft <= 0) return 'ended';
  if (secondsLeft <= TIMER_URGENT_THRESHOLD) return 'urgent';
  return 'normal';
};

const formatTime = (seconds: number): string => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const getSecondsLeft = (timer: SyncedAuctionTimer, clientNowMs: number) => {
  const serverNowMs = Date.parse(timer.serverNow);
  const serverStartedAtMs = Date.parse(timer.serverStartedAt);

  if (Number.isNaN(serverNowMs) || Number.isNaN(serverStartedAtMs)) {
    return 0;
  }

  const offsetMs = serverNowMs - timer.receivedAtMs;
  const estimatedServerNowMs = clientNowMs + offsetMs;
  const elapsedMs = estimatedServerNowMs - serverStartedAtMs;
  const remainingMs = timer.durationSeconds * 1000 - elapsedMs;

  return Math.max(0, Math.ceil(remainingMs / 1000));
};

export default function useAuctionTimer({ timer, onExpire }: UseAuctionTimerOptions): UseAuctionTimerReturn {
  const [clientNowMs, setClientNowMs] = useState(() => Date.now());
  const secondsLeft = getSecondsLeft(timer, clientNowMs);
  const handleExpire = useEffectEvent(onExpire);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setClientNowMs(Date.now());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [secondsLeft, timer.receivedAtMs]);

  useEffect(() => {
    if (secondsLeft > 0) {
      return;
    }

    handleExpire();
  }, [secondsLeft]);

  const phase = getPhase(secondsLeft);
  const displayValue = phase === 'normal' ? formatTime(secondsLeft) : phase === 'urgent' ? String(secondsLeft) : '종료';
  const displaySize = phase === 'ended' ? 'sm' : 'md';

  return { secondsLeft, phase, displayValue, displaySize };
}
