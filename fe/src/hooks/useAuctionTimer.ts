import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { TIMER_EXTENSION_SECONDS, TIMER_URGENT_THRESHOLD } from '@/constants/auction';
import type { AuctionDuration, TimerPhase } from '@/types';

interface UseAuctionTimerOptions {
  totalSeconds: AuctionDuration;
  onExpire: () => void;
  resetTrigger?: number;
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

export default function useAuctionTimer({
  totalSeconds,
  onExpire,
  resetTrigger,
}: UseAuctionTimerOptions): UseAuctionTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);
  const prevResetTrigger = useRef(resetTrigger);
  const handleExpire = useEffectEvent(onExpire);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [secondsLeft]);

  useEffect(() => {
    if (secondsLeft > 0) {
      return;
    }

    handleExpire();
  }, [secondsLeft]);

  useEffect(() => {
    const isResetRequested =
      resetTrigger !== undefined && prevResetTrigger.current !== undefined && resetTrigger !== prevResetTrigger.current;

    prevResetTrigger.current = resetTrigger;

    if (!isResetRequested) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((prev) => (getPhase(prev) === 'urgent' ? TIMER_EXTENSION_SECONDS : prev));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [resetTrigger]);

  const phase = getPhase(secondsLeft);
  const displayValue = phase === 'normal' ? formatTime(secondsLeft) : phase === 'urgent' ? String(secondsLeft) : '마감';
  const displaySize = phase === 'normal' ? 'md' : phase === 'urgent' ? 'lg' : 'sm';

  return { secondsLeft, phase, displayValue, displaySize };
}
