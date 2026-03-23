import type { RefObject } from 'react';

interface Props {
  onIntroduce: () => void;
  onStart: () => void;
  canIntroduce: boolean;
  canStart: boolean;
  introduceButtonRef?: RefObject<HTMLButtonElement | null>;
  startButtonRef?: RefObject<HTMLButtonElement | null>;
  introduceButtonClassName?: string;
  startButtonClassName?: string;
}

export default function SellerActionButtons({
  onIntroduce,
  onStart,
  canIntroduce,
  canStart,
  introduceButtonRef,
  startButtonRef,
  introduceButtonClassName = '',
  startButtonClassName = '',
}: Props) {
  return (
    <>
      <button
        ref={introduceButtonRef}
        type="button"
        onClick={onIntroduce}
        disabled={!canIntroduce}
        className={`flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-surface-elevated text-base font-bold text-neutral-300 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-elevated ${introduceButtonClassName}`}
      >
        <GoClock size={15} />
        설명 시작
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-caption text-neutral-500">SPACE</span>
      </button>
      <button
        ref={startButtonRef}
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className={`flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-gold text-base font-black text-background transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold ${startButtonClassName}`}
      >
        <PlayIcon />
        경매 시작
        <span className="rounded bg-background/15 px-1.5 py-0.5 text-caption font-bold text-background/50">
          ENTER
        </span>
      </button>
    </>
  );
}

function PlayIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function GoClock({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
