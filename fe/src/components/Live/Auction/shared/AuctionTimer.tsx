import { useEffect, useState } from 'react';

import useAuctionTimer from '@/hooks/useAuctionTimer';
import type { SyncedAuctionTimer } from '@/types';

interface Props {
  timer: SyncedAuctionTimer;
  onExpire: () => void;
}

const phaseStyles = {
  normal: {
    border: 'border-[rgba(74,127,165,.35)]',
    text: 'text-white',
    label: 'text-[#a1a1aa]',
    glow: '',
    animation: 'animate-shimmer',
  },
  urgent: {
    border: 'border-[rgba(239,68,68,.5)]',
    text: 'text-[#f87171]',
    label: 'text-[#f87171]',
    glow: 'shadow-[0_0_14px_rgba(239,68,68,.2)]',
    animation: 'animate-urgent-pulse',
  },
  ended: {
    border: 'border-[rgba(52,211,153,.35)]',
    text: 'text-[#71717a]',
    label: 'text-[#34d399]',
    glow: '',
    animation: '',
  },
};

const sizeStyles = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-[32px]',
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
      className={`flex flex-col items-center gap-1 rounded-2xl border bg-[rgba(0,0,0,.5)] px-5 py-3 transition-all ${style.border} ${style.glow} ${style.animation}`}
    >
      <span className={`text-[10px] font-medium ${style.label}`}>{phase === 'ended' ? '경매 종료' : '남은 시간'}</span>
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
