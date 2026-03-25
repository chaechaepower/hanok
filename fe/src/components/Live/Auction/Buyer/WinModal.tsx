import { useEffect, useRef, useState } from 'react';
import { GoTrophy } from 'react-icons/go';

import { getItemConditionLabel } from '@/constants/itemCondition';
import type { WinModalProps } from '@/types/auction';
import { launchConfetti } from '@/utils/confetti';
import winModalEffectSound from '@/assets/Win_Modal_Effect_sound.mp3';

const preloadedWinAudio = new Audio(winModalEffectSound);
preloadedWinAudio.load();

export default function WinModal({
  isOpen,
  itemName,
  itemCond,
  finalPrice,
  address,
  onConfirm,
  layout = 'modal',
  disableConfetti = false,
}: WinModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemConditionLabel = getItemConditionLabel(itemCond);

  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }

    if (!prevOpenRef.current) {
      prevOpenRef.current = true;
      (preloadedWinAudio.cloneNode(true) as HTMLAudioElement).play().catch(() => {});
    }

    if (disableConfetti) return;

    return launchConfetti(canvasRef.current);
  }, [disableConfetti, isOpen]);

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

  const content = (
    <>
      {!disableConfetti && <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-101" />}

      <div className="relative z-100 w-full max-w-[560px] overflow-hidden rounded-(--radius-panel) border border-white/6 bg-surface">
        <div className="flex flex-col items-center gap-3 border-b border-gold/10 bg-[linear-gradient(160deg,rgba(205,145,80,.08)_0%,transparent_60%)] px-7 py-8 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/18 bg-gold/[0.08] text-[30px]">
            <GoTrophy className="text-primary-light" />
          </div>
          <h2 className="text-center text-[22px] font-black text-point">낙찰을 축하드립니다! 🎉</h2>
          <p className="text-center text-[14px] text-neutral-500">
            결제가 완료되었습니다. 라이브는 계속 시청 가능합니다.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-7 py-6">
          <div className="flex items-center justify-between gap-4 rounded-(--radius-panel) border border-white/6 bg-white/3 px-4.5 py-4">
            <div className="min-w-0 flex shrink-0 flex-col gap-2">
              <p className="truncate text-sub-lg font-bold text-warm">{itemName}</p>
              <p className="text-sub-sm text-neutral-500">{itemConditionLabel}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end">
              <span className="text-sub-sm text-neutral-500">낙찰가</span>
              <span className="text-price-lg font-black text-gold">{finalPrice.toLocaleString('ko-KR')}원</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sub-sm font-extrabold uppercase text-neutral-400">배송지 정보</p>
            <div className="rounded-2xl border border-white/7 bg-white/[0.02] px-4 py-3.5">
              <p className="text-sub-sm font-bold leading-[1.6] text-white">
                {address.addressName} ({address.recipientName})
              </p>
              <p className="mt-1.5 break-keep text-sub-sm text-neutral-400">{address.phone}</p>
              <p className="break-keep text-sub-sm text-neutral-400">
                ({address.postalCode}) {address.address} {address.addressDetail}
              </p>
            </div>
          </div>

          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-(--radius-panel) bg-point px-4 py-3 text-body-lg text-background outline-none transition disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '확인'}
          </button>

          <p className="text-center text-sub-sm text-neutral-500">
            낙찰 즉시 결제 완료 · <em className="not-italic font-bold text-gold">영업일 기준 2~5일</em> 이내 발송
          </p>
        </div>
      </div>
    </>
  );

  if (layout === 'panel') {
    return <div className="relative flex w-full max-w-[560px] justify-center">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-(--modal-backdrop) px-4 backdrop-blur-(--modal-blur)">
      {content}
    </div>
  );
}
