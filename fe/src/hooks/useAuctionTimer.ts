import { useEffect, useRef, useState } from "react";
import type { AuctionDuration, TimerPhase } from "@/types";
import {
  TIMER_EXTENSION_SECONDS,
  TIMER_URGENT_THRESHOLD,
} from "@/constants/auction";

interface UseAuctionTimerOptions {
  totalSeconds: AuctionDuration;
  onExpire: () => void;
  resetTrigger?: number;
}

interface UseAuctionTimerReturn {
  secondsLeft: number;
  phase: TimerPhase;
  displayValue: string;
  displaySize: "sm" | "md" | "lg";
}

const getPhase = (secondsLeft: number): TimerPhase => {
  if (secondsLeft <= 0) return "ended";
  if (secondsLeft <= TIMER_URGENT_THRESHOLD) return "urgent";
  return "normal";
};

const formatTime = (seconds: number): string => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

export default function useAuctionTimer({
  totalSeconds,
  onExpire,
  resetTrigger,
}: UseAuctionTimerOptions): UseAuctionTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  const prevResetTrigger = useRef(resetTrigger);

  onExpireRef.current = onExpire;

  // 카운트다운
  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpireRef.current();
      return;
    }
    const t = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // 입찰 리셋 — urgent 구간에서만
  useEffect(() => {
    if (
      resetTrigger !== undefined &&
      prevResetTrigger.current !== undefined &&
      resetTrigger !== prevResetTrigger.current
    ) {
      const phase = getPhase(secondsLeft);
      if (phase === "urgent") {
        setSecondsLeft(TIMER_EXTENSION_SECONDS);
      }
    }
    prevResetTrigger.current = resetTrigger;
  }, [resetTrigger]);

  const phase = getPhase(secondsLeft);

  let displayValue: string;
  let displaySize: "sm" | "md" | "lg";

  switch (phase) {
    case "normal":
      displayValue = formatTime(secondsLeft);
      displaySize = "md";
      break;
    case "urgent":
      displayValue = String(secondsLeft);
      displaySize = "lg";
      break;
    case "ended":
      displayValue = "낙찰";
      displaySize = "sm";
      break;
  }

  return { secondsLeft, phase, displayValue, displaySize };
}
