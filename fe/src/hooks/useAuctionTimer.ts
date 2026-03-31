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

const getRemainingMs = (timer: SyncedAuctionTimer, clientNowMs: number) => {
  const serverNowMs = Date.parse(timer.serverNow);
  const serverStartedAtMs = Date.parse(timer.serverStartedAt);

  if (Number.isNaN(serverNowMs) || Number.isNaN(serverStartedAtMs)) {
    return 0;
  }

  const offsetMs = serverNowMs - timer.receivedAtMs;
  const estimatedServerNowMs = clientNowMs + offsetMs;
  const elapsedMs = estimatedServerNowMs - serverStartedAtMs;
  return Math.max(0, timer.durationSeconds * 1000 - elapsedMs);
};

const getSecondsLeft = (timer: SyncedAuctionTimer, clientNowMs: number) => Math.max(0, Math.ceil(getRemainingMs(timer, clientNowMs) / 1000));

export default function useAuctionTimer({ timer, onExpire }: UseAuctionTimerOptions): UseAuctionTimerReturn {
  const [clientNowMs, setClientNowMs] = useState(() => Date.now());
  const secondsLeft = getSecondsLeft(timer, clientNowMs);
  const handleExpire = useEffectEvent(onExpire);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const remainingMs = getRemainingMs(timer, Date.now());
    const nextDelay = Math.max(1, remainingMs - (secondsLeft - 1) * 1000);

    const timeoutId = window.setTimeout(() => {
      setClientNowMs(Date.now());
    }, nextDelay);

    return () => window.clearTimeout(timeoutId);
  }, [secondsLeft, timer]);

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
