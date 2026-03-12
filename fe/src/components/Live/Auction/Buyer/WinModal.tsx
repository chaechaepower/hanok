import { useEffect, useRef, useState } from 'react';

import type { WinModalProps } from '@/types/auction';
import { launchConfetti } from '@/utils/confetti';
import { GoTrophy } from 'react-icons/go';

export default function WinModal({ isOpen, itemName, itemCond, finalPrice, address, onConfirm }: WinModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return launchConfetti(canvasRef.current);
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(0,0,0,.45)] px-4 backdrop-blur-[10px]">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-101" />

      <div className="relative z-100 w-105 overflow-hidden rounded-4xl bg-[#131315]">
        <div className="flex flex-col items-center gap-3 border-b border-[rgba(99,102,241,.1)] bg-[linear-gradient(160deg,rgba(99,102,241,.08)_0%,transparent_60%)] px-7 py-8 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(99,102,241,.18)] bg-[rgba(246,206,59,0.08)] text-[30px]">
            <GoTrophy color="#c7b281" />
          </div>
          <h2 className="text-center text-[22px] font-black text-point">낙찰을 축하드립니다! 🎉</h2>
          <p className="text-center text-xs text-[#767676]">결제가 완료되었습니다. 라이브는 계속 시청 가능합니다.</p>
        </div>

        <div className="flex flex-col gap-4 px-7 py-6">
          <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[rgba(255,255,255,.06)] bg-[rgba(255,255,255,.03)] px-4.5 py-5">
            <div className="min-w-0 flex shrink-0 flex-col gap-2">
              <p className="truncate text-[13px] font-bold text-white">{itemName}</p>
              <p className="text-[10px] text-[#767676]">{itemCond}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-[10px] text-[#767676]">낙찰가</span>
              <span className="text-[22px] font-black text-point">{finalPrice.toLocaleString('ko-KR')}원</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-extrabold uppercase text-[#a1a1aa]">배송지 정보</p>
            <div className="rounded-2xl border border-[rgba(255,255,255,.07)] bg-[rgba(255,255,255,.02)] px-4 py-3.5">
              <p className="text-xs font-bold leading-[1.6] text-white">
                {address.addressName} ({address.recipientName})
              </p>
              <p className="mt-1.5 break-keep text-[11px] text-[#b0b0b0]">{address.phone}</p>
              <p className="mt-1.5 break-keep text-[11px] text-[#b0b0b0]">
                ({address.postalCode}) {address.address} {address.addressDetail}
              </p>
            </div>
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-[20px] mt-4 mb-4 px-4 py-3 text-[15px] bg-point text-background outline-none transition disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '확인'}
          </button>

          <p className="text-center text-[10px] leading-[1.7] text-[#6e6e7c]">
            낙찰 즉시 결제 완료 · <em className="not-italic font-bold text-gold">영업일 기준 2~5일</em> 이내 발송
          </p>
        </div>
      </div>
    </div>
  );
}
