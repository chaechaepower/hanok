import { useEffect, useState } from "react";
import type { AuctionDuration } from "@/types";
import useAuctionTimer from "@/hooks/useAuctionTimer";

interface Props {
  totalSeconds: AuctionDuration;
  onExpire: () => void;
  resetTrigger?: number;
}

const phaseStyles = {
  normal: {
    border: "border-[rgba(74,127,165,.35)]",
    text: "text-white",
    label: "text-[#a1a1aa]",
    glow: "",
    animation: "animate-shimmer",
  },
  urgent: {
    border: "border-[rgba(239,68,68,.5)]",
    text: "text-[#f87171]",
    label: "text-[#f87171]",
    glow: "shadow-[0_0_14px_rgba(239,68,68,.2)]",
    animation: "animate-urgent-pulse",
  },
  ended: {
    border: "border-[rgba(52,211,153,.35)]",
    text: "text-[#71717a]",
    label: "text-[#34d399]",
    glow: "",
    animation: "",
  },
};

const sizeStyles = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-[32px]",
};

export default function AuctionTimer({
  totalSeconds,
  onExpire,
  resetTrigger,
}: Props) {
  const { phase, displayValue, displaySize, secondsLeft } = useAuctionTimer({
    totalSeconds,
    onExpire,
    resetTrigger,
  });

  // urgent 숫자 변경 시 pop 애니메이션
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (phase !== "urgent") return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 250);
    return () => clearTimeout(t);
  }, [secondsLeft, phase]);

  // 입찰 리셋 시 테두리 깜빡임
  const [resetFlash, setResetFlash] = useState(false);
  useEffect(() => {
    if (resetTrigger === undefined || resetTrigger === 0) return;
    setResetFlash(true);
    const t = setTimeout(() => setResetFlash(false), 300);
    return () => clearTimeout(t);
  }, [resetTrigger]);

  const style = phaseStyles[phase];
  const borderClass = resetFlash
    ? "border-[rgba(59,130,246,.8)]"
    : style.border;

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-2xl border bg-[rgba(0,0,0,.5)] px-5 py-3 transition-all ${borderClass} ${style.glow} ${style.animation}`}
    >
      <span className={`text-[10px] font-medium ${style.label}`}>
        {phase === "ended" ? "경매 종료" : "남은 시간"}
      </span>
      <span
        className={`font-black leading-none tabular-nums ${style.text} ${sizeStyles[displaySize]} ${
          pop ? "animate-pop" : ""
        } ${phase === "urgent" && secondsLeft <= 3 ? "!text-4xl" : ""}`}
      >
        {displayValue}
      </span>
    </div>
  );
}
