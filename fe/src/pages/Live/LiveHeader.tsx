import { useEffect, useState } from 'react';
import { GoHomeFill } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';

interface Props {
  streamTitle: string;
  isLive: boolean;
  startedAt: string | null;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function useElapsedTimer(isLive: boolean, startedAt: string | null) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const startMs = startedAt ? new Date(startedAt).getTime() : Number.NaN;
  const elapsed = !isLive || Number.isNaN(startMs) ? 0 : Math.max(0, Math.floor((nowMs - startMs) / 1000));

  useEffect(() => {
    if (!isLive || Number.isNaN(startMs)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLive, startMs]);

  return elapsed;
}

export default function LiveHeader({ streamTitle, isLive, startedAt }: Props) {
  const navigate = useNavigate();
  const elapsed = useElapsedTimer(isLive, startedAt);

  return (
    <div className="mb-2 flex shrink-0 items-center">
      <button
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-neutral-500 transition hover:bg-warm/5 hover:text-neutral-400"
        onClick={() => navigate('/')}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <GoHomeFill /> 홈
      </button>

      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-sm font-bold text-neutral-100">{streamTitle}</p>
      </div>

      <div className="shrink-0 px-2">
        {isLive ? (
          <span className="font-mono-num text-xs tabular-nums text-neutral-400">{formatElapsed(elapsed)}</span>
        ) : (
          <span className="text-xs text-neutral-600">대기중</span>
        )}
      </div>
    </div>
  );
}
