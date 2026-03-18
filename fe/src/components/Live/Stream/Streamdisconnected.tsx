import { useEffect, useRef, useState } from 'react';
import { MdOutlineWifiOff } from 'react-icons/md';

interface Props {
  initialSeconds?: number;
  onTimeout?: () => void;
}

export default function StreamDisconnected({ initialSeconds = 60, onTimeout }: Props) {
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
    <div className="animate-[fadeIn_.3s_ease] fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-[20px]">
      <div className="mx-4 flex aspect-square w-full max-w-[550px] flex-col overflow-hidden rounded-3xl border border-white/7 bg-surface shadow-[0_24px_60px_rgba(0,0,0,.6)]">
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08]">
              <MdOutlineWifiOff size={36} className="text-gold/80" />
              <div className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-gold-light animate-blink" />
            </div>
            <div className="text-xl font-bold tracking-wide text-gold">방송 연결이 끊어졌습니다.</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="tabular-nums text-[80px] font-black leading-none tracking-wider text-white">
              {mm}
              <span className="mx-1.5 text-[60px] font-normal text-neutral-700">:</span>
              {ss}
            </div>
            <div className="text-sm text-neutral-600">판매자 재연결을 기다리고 있습니다.</div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center text-base leading-relaxed text-neutral-500">
            <span className="font-semibold text-gold/70">60초 안에 판매자가 다시 연결되면</span>
            <span className="font-semibold text-gold/70">방송이 이어서 재개됩니다.</span>
          </div>
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
