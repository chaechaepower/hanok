import { useEffect, useState } from 'react';
import { GoHomeFill } from 'react-icons/go';
import { MdOutlinePowerSettingsNew } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

interface Props {
  streamTitle: string;
  isLive: boolean;
  startedAt: string | null;
  showEndButton?: boolean;
  isEndDisabled?: boolean;
  isEnding?: boolean;
  onEndStream?: () => void;
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

export default function LiveHeader({
  streamTitle,
  isLive,
  startedAt,
  showEndButton = false,
  isEndDisabled = false,
  isEnding = false,
  onEndStream,
}: Props) {
  const navigate = useNavigate();
  const elapsed = useElapsedTimer(isLive, startedAt);

  return (
    <div className="mb-2 flex h-11 shrink-0 items-center">
      <button
        type="button"
        className="flex h-full shrink-0 items-center gap-2 rounded-lg px-3 text-body-md font-bold text-neutral-400 transition hover:bg-warm/5 hover:text-neutral-200"
        onClick={() => navigate('/main')}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <GoHomeFill size={16} />
      </button>

      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-lg font-bold text-neutral-100">{streamTitle}</p>
      </div>

      <div className="flex h-full shrink-0 items-center gap-4 px-2">
        {isLive ? (
          <span className="font-mono-num text-base tabular-nums text-neutral-400">{formatElapsed(elapsed)}</span>
        ) : (
          <span className="text-base text-neutral-600">방송 대기중</span>
        )}
        {showEndButton && (
          <button
            type="button"
            onClick={onEndStream}
            disabled={isEndDisabled || isEnding}
            className="flex h-full items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/12 px-3 text-sm font-bold text-accent-light transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600"
          >
            <MdOutlinePowerSettingsNew size={16} />
            {isEnding ? '종료 중...' : '방송 종료'}
          </button>
        )}
      </div>
    </div>
  );
}
