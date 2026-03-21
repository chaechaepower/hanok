import { useEffect, useRef, useState } from 'react';
import { MdOutlineWifiOff } from 'react-icons/md';

interface Props {
  initialSeconds?: number;
  onTimeout?: () => void;
  onExit?: () => void;
}

export default function StreamDisconnected({ initialSeconds = 300, onTimeout, onExit }: Props) {
  const [secs, setSecs] = useState(initialSeconds);
  const calledRef = useRef(false);

  useEffect(() => {
    if (secs <= 0) {
      if (!calledRef.current) {
        calledRef.current = true;
        onTimeout?.();
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSecs((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [secs, onTimeout]);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const progress = ((initialSeconds - secs) / initialSeconds) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex animate-[fadeIn_.3s_ease] items-center justify-center bg-black/70 backdrop-blur-[20px]">
      <div className="mx-4 flex w-full max-w-[550px] flex-col overflow-hidden rounded-3xl border border-white/7 bg-surface shadow-[0_24px_60px_rgba(0,0,0,.6)]">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 py-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08]">
              <MdOutlineWifiOff size={36} className="text-gold/80" />
              <div className="absolute right-0.5 top-0.5 h-3.5 w-3.5 animate-blink rounded-full border-2 border-surface bg-gold-light" />
            </div>
            <div className="text-center text-xl font-bold tracking-wide text-gold">
              방송 연결이 일시적으로 끊겼습니다
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="tabular-nums text-[80px] font-black leading-none tracking-wider text-white">
              {mm}
              <span className="mx-1.5 text-[60px] font-normal text-neutral-700">:</span>
              {ss}
            </div>
            <div className="text-sm text-neutral-500">판매자 재연결을 기다리고 있습니다</div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center text-base leading-relaxed text-neutral-500">
            <span className="font-semibold text-gold/70">판매자가 다시 연결되면 방송이 재개됩니다</span>
            <span className="font-semibold text-gold/70">조금만 기다려주세요</span>
          </div>

          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="w-[70%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] font-bold text-white/80 transition hover:bg-white/10"
            >
              나가기
            </button>
          ) : null}
        </div>

        <div className="h-1 w-full bg-white/[.04]">
          <div
            className="h-full bg-gradient-to-r from-gold-dark to-gold transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
