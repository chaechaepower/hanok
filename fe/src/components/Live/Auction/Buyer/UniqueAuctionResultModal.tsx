import { useEffect, useRef, useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { GoTrophy } from 'react-icons/go';

import { getItemConditionLabel } from '@/constants/itemCondition';
import { useEscKey } from '@/hooks/useEscKey';
import type { BidWinnerPayload, ItemSyncItem, UniqueAuctionEndPayload } from '@/types';
import { launchConfetti } from '@/utils/confetti';
import { launchGloomEffect } from '@/utils/gloomEffect';
import { formatPrice } from '@/utils/formatPrice';

type WinnerInfoState = {
  payload: BidWinnerPayload;
  itemCond: ItemSyncItem['itemCondition'] | '';
};

type Props = {
  isOpen: boolean;
  itemName: string;
  payload: UniqueAuctionEndPayload;
  winnerInfo?: WinnerInfoState | null;
  onClose: () => void;
  layout?: 'modal' | 'panel';
};

export default function UniqueAuctionResultModal({
  isOpen,
  itemName,
  payload,
  winnerInfo = null,
  onClose,
  layout = 'modal',
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasWinner = payload.isWon;
  const isMyWin = hasWinner && payload.winnerPrice !== null && payload.winnerPrice === payload.myBidPrice;
  const isOtherWin = hasWinner && !isMyWin;
  const isUnsold = !hasWinner;
  const hasTopDuplicates = Boolean(payload.topDuplicates && payload.topDuplicates.length > 0);
  const itemConditionLabel = winnerInfo ? getItemConditionLabel(winnerInfo.itemCond) : null;

  useEscKey(isOpen && layout === 'modal', onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isMyWin) {
      return launchConfetti(canvasRef.current);
    }

    if (isUnsold) {
      return launchGloomEffect(canvasRef.current);
    }
  }, [isMyWin, isOpen, isUnsold]);

  if (!isOpen) {
    return null;
  }

  const badgeText = hasWinner ? '낙찰 성공' : '낙찰 실패';
  const titleText = isMyWin
    ? '낙찰에 성공하셨습니다!'
    : isOtherWin
      ? '다른 구매자의 낙찰이 확정되었습니다'
      : '이번 경매는 유찰되었습니다';

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const winnerContent = winnerInfo && isMyWin && (
    <>
      <div className="flex items-center justify-between gap-4 rounded-(--radius-panel) border border-white/6 bg-white/3 px-4.5 py-4">
        <div className="min-w-0 flex shrink-0 flex-col gap-2">
          <p className="truncate text-sub-lg font-bold text-warm">{itemName}</p>
          <p className="text-sub-sm text-neutral-500">{itemConditionLabel}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-sub-sm text-neutral-500">낙찰가</span>
          <span className="text-price-lg font-black text-gold">
            {payload.winnerPrice !== null ? formatPrice(payload.winnerPrice) : '-'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sub-sm font-extrabold uppercase text-neutral-400">배송지 정보</p>
        <div className="rounded-2xl border border-white/7 bg-white/[0.02] px-4 py-3.5">
          <p className="text-sub-sm font-bold leading-[1.6] text-white">
            {winnerInfo.payload.shipping.addressName} ({winnerInfo.payload.shipping.recipientName})
          </p>
          <p className="mt-1.5 break-keep text-sub-sm text-neutral-400">{winnerInfo.payload.shipping.phone}</p>
          <p className="break-keep text-sub-sm text-neutral-400">
            ({winnerInfo.payload.shipping.postalCode}) {winnerInfo.payload.shipping.address}{' '}
            {winnerInfo.payload.shipping.addressDetail}
          </p>
        </div>
      </div>
    </>
  );

  const resultContent = !winnerInfo || !isMyWin;

  const content = (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-101" />

      <div className="relative z-100 w-full max-w-[560px] overflow-hidden rounded-(--radius-panel) border border-white/6 bg-surface shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
        <div
          className={`flex flex-col items-center gap-3 border-b px-7 py-8 pb-6 text-center ${
            hasWinner
              ? 'border-gold/10 bg-[linear-gradient(160deg,rgba(205,145,80,.08)_0%,transparent_60%)]'
              : 'border-white/6 bg-[linear-gradient(160deg,rgba(148,163,184,0.10)_0%,transparent_65%)]'
          }`}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border text-[30px] ${
              hasWinner
                ? 'border-gold/18 bg-gold/[0.08] text-primary-light'
                : 'border-slate-300/10 bg-slate-300/[0.06] text-slate-300'
            }`}
          >
            {hasWinner ? <GoTrophy /> : <FiAlertCircle />}
          </div>

          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-extrabold ${
              hasWinner
                ? 'border-gold/18 bg-gold/[0.08] text-gold-light'
                : 'border-slate-300/10 bg-slate-300/[0.06] text-slate-300'
            }`}
          >
            {badgeText}
          </div>

          <h2 className={`text-center text-[22px] font-black ${hasWinner ? 'text-point' : 'text-white'}`}>
            {titleText}
          </h2>
        </div>

        <div className="flex flex-col gap-4 px-7 py-6">
          {winnerContent}

          {resultContent && (
            <>
              <div className="rounded-[22px] border border-white/7 bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
                <span className="text-[14px] font-extrabold text-neutral-500">경매 물품{` | `}</span>
                <span className="mt-2 text-[18px] font-bold text-white">{itemName}</span>
              </div>

              {isMyWin && (
                <div className="rounded-(--radius-panel) border border-gold/12 bg-[linear-gradient(180deg,rgba(205,145,80,0.12)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-5">
                  <div className="text-sub-sm font-extrabold text-gold-light/80">낙찰가</div>
                  <div className="mt-3 text-price-lg leading-none font-black text-point">
                    {payload.winnerPrice !== null ? formatPrice(payload.winnerPrice) : '-'}
                  </div>
                </div>
              )}

              {isOtherWin && (
                <div className="rounded-(--radius-panel) border border-gold/12 bg-[linear-gradient(180deg,rgba(205,145,80,0.12)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sub-sm font-extrabold text-gold-light/80">최종 낙찰가</div>
                      <div className="mt-3 text-price-md leading-none font-black text-point">
                        {payload.winnerPrice !== null ? formatPrice(payload.winnerPrice) : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sub-sm font-extrabold text-gold-light/80">나의 입찰가</div>
                      <div className="mt-3 text-price-md leading-none font-black text-white">
                        {payload.myBidPrice !== null ? formatPrice(payload.myBidPrice) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isUnsold && (
                <div className="rounded-(--radius-panel) border border-slate-300/10 bg-[linear-gradient(180deg,rgba(148,163,184,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5">
                  {hasTopDuplicates ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sub-lg font-extrabold text-slate-300/90">상위 중복 입찰</div>
                        </div>
                        <div className="rounded-full border border-slate-300/12 bg-black/20 px-3 py-1 text-[12px] font-bold text-slate-300">
                          {payload.topDuplicates?.length}건
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3">
                        {payload.topDuplicates?.map((duplicate, index) => (
                          <div
                            key={`${duplicate.price}-${duplicate.count}`}
                            className="flex items-center justify-between rounded-[18px] border border-white/6 bg-black/18 px-4 py-3"
                          >
                            <div>
                              <span className="text-[12px] font-extrabold uppercase text-neutral-500">
                                {index + 1}위
                              </span>
                              <span className="mt-1 text-[20px] font-black text-white">
                                {`  `}
                                {formatPrice(duplicate.price)}
                              </span>
                            </div>
                            <div className="rounded-full border border-slate-300/12 bg-slate-300/[0.05] px-3 py-1 text-[12px] font-semibold text-slate-300">
                              {duplicate.count}명 중복
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
            </>
          )}

          {winnerInfo && isMyWin && (
            <p className="text-center text-sub-sm text-neutral-500">
              낙찰 상품 배송은 결제 확인 후 <em className="not-italic font-bold text-gold">영업일 기준 2~5일</em> 내에
              진행됩니다.
            </p>
          )}

          <button
            className={`mt-2 flex w-full items-center justify-center rounded-(--radius-panel) px-4 py-3 text-body-lg outline-none transition disabled:cursor-not-allowed disabled:opacity-40 ${
              hasWinner
                ? 'bg-point text-background hover:opacity-90'
                : 'border border-white/8 bg-white/6 text-white hover:bg-white/10'
            }`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '확인'}
          </button>
        </div>
      </div>
    </>
  );

  if (layout === 'panel') {
    return <div className="relative flex w-full max-w-[560px] justify-center">{content}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-(--modal-backdrop) px-4 backdrop-blur-(--modal-blur)"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {content}
    </div>
  );
}
