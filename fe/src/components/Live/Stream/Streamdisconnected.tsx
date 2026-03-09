import { useEffect, useRef, useState } from "react";
import { MdOutlineWifiOff } from "react-icons/md";

interface Props {
  onTimeout?: () => void;
}

export default function StreamDisconnected({ onTimeout }: Props) {
  const [secs, setSecs] = useState(60);
  const calledRef = useRef(false);

  useEffect(() => {
    if (secs <= 0) {
      if (!calledRef.current) {
        calledRef.current = true;
        onTimeout?.();
      }
      return;
    }
    const t = setTimeout(() => setSecs((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onTimeout]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const progress = ((60 - secs) / 60) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-[20px] animate-[fadeIn_.3s_ease]">
      <div className="flex w-full max-w-[550px] mx-4 aspect-square flex-col overflow-hidden rounded-3xl border border-white/[.07] bg-[#111113] shadow-[0_24px_60px_rgba(0,0,0,.6)]">
        {/* 콘텐츠 영역 — 세로 중앙, 8px grid spacing */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {/* 상단 그룹: 아이콘 + 타이틀 */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(197,160,89,.2)] bg-[rgba(197,160,89,.08)]">
              <MdOutlineWifiOff size={36} className="text-[rgba(197,160,89,.8)]" />
              <div className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111113] bg-amber-500 animate-blink" />
            </div>
            <div className="text-xl font-bold tracking-wide text-gold">
              방송 재연결 중...
            </div>
          </div>

          {/* 중앙 그룹: 타이머 + 상태 */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[80px] font-black leading-none tracking-wider text-white tabular-nums">
              {mm}
              <span className="mx-1.5 text-[60px] font-normal text-[#3f3f46]">
                :
              </span>
              {ss}
            </div>
            <div className="text-sm text-[#52525b]">
              자동으로 재연결을 시도하고 있습니다.
            </div>
          </div>

          {/* 하단 그룹: 안내 텍스트 */}
          <div className="flex flex-col items-center gap-1 text-center text-base leading-relaxed text-[#71717a]">
            <span className="font-semibold text-[rgba(197,160,89,.7)]">
              1분 내 연결되지 않을 경우,
            </span>
            <span className="font-semibold text-[rgba(197,160,89,.7)]">
              경매는 자동 취소됩니다.
            </span>
          </div>
        </div>

        {/* 프로그레스 바 — 하단 고정 */}
        <div className="h-1 w-full bg-white/[.04]">
          <div
            className="h-full bg-gradient-to-r from-[#8B7345] to-gold transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
