import { useEffect, useRef } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { GoTrophy } from 'react-icons/go';
import { useEscKey } from '@/hooks/useEscKey';
import type { UniqueAuctionEndPayload } from '@/types';
import { launchConfetti } from '@/utils/confetti';
import { launchGloomEffect } from '@/utils/gloomEffect';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  isOpen: boolean;
  itemName: string;
  payload: UniqueAuctionEndPayload;
  onClose: () => void;
};

export default function UniqueAuctionResultModal({ isOpen, itemName, payload, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isWon = payload.isWon;
  const hasTopDuplicates = Boolean(payload.topDuplicates && payload.topDuplicates.length > 0);

  useEscKey(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return payload.isWon ? launchConfetti(canvasRef.current) : launchGloomEffect(canvasRef.current);
  }, [isOpen, payload.isWon]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-(--modal-backdrop) px-4 backdrop-blur-(--modal-blur)"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-101" />

      <div
        className="relative z-100 w-full max-w-xl overflow-hidden rounded-[30px] border border-white/8 bg-surface shadow-[0_28px_80px_rgba(0,0,0,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`absolute inset-x-0 top-0 h-46 ${
            isWon
              ? 'bg-[radial-gradient(circle_at_top,rgba(205,145,80,0.24),transparent_68%)]'
              : 'bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.16),transparent_70%)]'
          }`}
        />
        <div
          className={`absolute -top-18 right-[-40px] h-44 w-44 rounded-full blur-3xl ${
            isWon ? 'bg-gold/14' : 'bg-slate-300/8'
          }`}
        />
        <div
          className={`absolute -left-12 top-22 h-34 w-34 rounded-full blur-3xl ${
            isWon ? 'bg-amber-200/8' : 'bg-slate-400/8'
          }`}
        />

        <div className="relative border-b border-white/6 px-7 py-8 pb-7">
          <div className="flex flex-col items-center text-center">
            <div
              className={`flex h-18 w-18 items-center justify-center rounded-full border text-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${
                isWon
                  ? 'border-gold/25 bg-gold/[0.09] text-point'
                  : 'border-slate-300/10 bg-slate-300/[0.06] text-slate-300'
              }`}
            >
              {isWon ? <GoTrophy /> : <FiAlertCircle />}
            </div>

            <div
              className={`mt-4 inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-extrabold ${
                isWon
                  ? 'border-gold/18 bg-gold/[0.08] text-gold-light'
                  : 'border-slate-300/10 bg-slate-300/[0.06] text-slate-300'
              }`}
            >
              {isWon ? '낙찰 성공' : '낙찰 실패'}
            </div>

            <h2 className={`mt-4 text-[28px] leading-none font-black ${isWon ? 'text-gold' : 'text-white'}`}>
              {isWon ? '낙찰이 확정되었습니다' : '이번 경매는 유찰되었습니다'}
            </h2>
          </div>

          <div className="mt-6 rounded-[22px] border border-white/7 bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
            <span className="text-[14px] font-extrabold text-neutral-500">경매 물품{` | `}</span>
            <span className="mt-2 text-[18px] font-bold text-white">{itemName}</span>
          </div>
        </div>

        <div className="relative flex flex-col gap-5 px-7 py-7">
          {isWon ? (
            <div className="rounded-(--radius-panel) border border-gold/12 bg-[linear-gradient(180deg,rgba(205,145,80,0.12)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-5">
              <div className="text-sub-sm font-extrabold text-gold-light/80">최종 낙찰 가격</div>
              <div className="mt-3 text-price-lg leading-none font-black text-point">
                {payload.winnerPrice !== null ? formatPrice(payload.winnerPrice) : '-'}
              </div>
            </div>
          ) : (
            <div className="rounded-(--radius-panel) border border-slate-300/10 bg-[linear-gradient(180deg,rgba(148,163,184,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5">
              {hasTopDuplicates ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sub-lg font-extrabold text-slate-300/90">상위 중복 금액</div>
                    </div>
                    <div className="rounded-full border border-slate-300/12 bg-black/20 px-3 py-1 text-[12px] font-bold text-slate-300">
                      {payload.topDuplicates?.length}건
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {payload.topDuplicates?.map((duplicate, index) => (
                      <div
                        key={`${duplicate.price}-${duplicate.cnt}`}
                        className="flex items-center justify-between rounded-[18px] border border-white/6 bg-black/18 px-4 py-3"
                      >
                        <div>
                          <span className="text-[12px] font-extrabold uppercase text-neutral-500">{index + 1}위</span>
                          <span className="mt-1 text-[20px] font-black text-white align-items">
                            {`  `}
                            {formatPrice(duplicate.price)}
                          </span>
                        </div>
                        <div className="rounded-full border border-slate-300/12 bg-slate-300/[0.05] px-3 py-1 text-[12px] font-semibold text-slate-300">
                          {duplicate.cnt}명 중복
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-body-sm font-extrabold text-slate-300/80">입찰 없음</div>
                  <p className="mt-2 text-price-md font-black text-white">이번 라운드에서는 낙찰자가 없었습니다</p>
                </>
              )}
            </div>
          )}

          <div className="rounded-[22px] border border-white/6 bg-black/18 px-5 py-4">
            <div className="text-[14px] font-extrabold uppercase text-neutral-500">참고 사항</div>
            <p className="mt-2 text-[16px] leading-6 text-neutral-300">
              라이브 시청은 계속 가능합니다. 다음 경매에 참여하세요!
            </p>
          </div>

          <button
            className={`mt-1 flex w-full items-center justify-center rounded-(--radius-panel) px-4 py-3.5 text-sub-lg font-bold transition ${
              isWon
                ? 'bg-point text-background hover:opacity-90'
                : 'border border-white/8 bg-white/6 text-white hover:bg-white/10'
            }`}
            onClick={onClose}
          >
            결과 확인
          </button>
        </div>
      </div>
    </div>
  );
}
