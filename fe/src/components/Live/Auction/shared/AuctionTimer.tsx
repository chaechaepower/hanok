import { useEffect, useState } from 'react';

import useAuctionTimer from '@/hooks/useAuctionTimer';
import type { SyncedAuctionTimer } from '@/types';

interface Props {
  timer: SyncedAuctionTimer;
  onExpire: () => void;
}

const phaseStyles = {
  normal: {
    border: 'border-primary/35',
    text: 'text-white',
    label: 'text-neutral-400',
    glow: '',
    animation: 'animate-shimmer',
  },
  urgent: {
    border: 'border-accent-light/50',
    text: 'text-accent-light',
    label: 'text-accent-light',
    glow: 'shadow-[0_0_14px_var(--color-accent-light)/20]',
    animation: 'animate-urgent-pulse',
  },
  ended: {
    border: 'border-ember/35',
    text: 'text-neutral-500',
    label: 'text-ember',
    glow: '',
    animation: '',
  },
};

const sizeStyles = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-h1',
};

export default function AuctionTimer({ timer, onExpire }: Props) {
  const { phase, displayValue, displaySize, secondsLeft } = useAuctionTimer({
    timer,
    onExpire,
  });

  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (phase !== 'urgent') return;
    const startTimer = setTimeout(() => setPop(true), 0);
    const endTimer = setTimeout(() => setPop(false), 250);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [secondsLeft, phase]);

  const style = phaseStyles[phase];

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-2xl border bg-background/80 px-5 py-3 transition-all ${style.border} ${style.glow} ${style.animation}`}
    >
      <span className={`text-caption font-medium ${style.label}`}>{phase === 'ended' ? '경매 종료' : '남은 시간'}</span>
      <span
        className={`font-black leading-none tabular-nums ${style.text} ${sizeStyles[displaySize]} ${
          pop ? 'animate-pop' : ''
        }`}
      >
        {displayValue}
      </span>
    </div>
  );
}
