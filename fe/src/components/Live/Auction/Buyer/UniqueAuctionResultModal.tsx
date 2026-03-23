import { useEscKey } from '@/hooks/useEscKey';
import type { UniqueAuctionEndPayload } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  isOpen: boolean;
  itemName: string;
  payload: UniqueAuctionEndPayload;
  onClose: () => void;
};

export default function UniqueAuctionResultModal({ isOpen, itemName, payload, onClose }: Props) {
  useEscKey(isOpen, onClose);

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
      <div
        className="relative z-100 w-full max-w-md overflow-hidden rounded-(--radius-panel) border border-white/6 bg-surface"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gold/10 bg-[linear-gradient(160deg,rgba(205,145,80,.08)_0%,transparent_60%)] px-7 py-8">
          <div className="text-center text-[22px] font-black text-point">
            {payload.isWon ? '유일 최고가 낙찰' : '유찰'}
          </div>
          <p className="mt-2 text-center text-xs text-neutral-500">{itemName}</p>
        </div>

        <div className="flex flex-col gap-4 px-7 py-6">
          {payload.isWon ? (
            <div className="rounded-(--radius-panel) border border-white/6 bg-white/3 px-4.5 py-5">
              <div className="text-label font-bold text-neutral-500">낙찰 금액</div>
              <div className="mt-2 text-2xl font-black text-point">
                {payload.winnerPrice !== null ? formatPrice(payload.winnerPrice) : '-'}
              </div>
              <p className="mt-3 text-label leading-6 text-neutral-400">
                유일한 최고 입찰가로 낙찰되었습니다.
              </p>
            </div>
          ) : (
            <div className="rounded-(--radius-panel) border border-white/6 bg-white/3 px-4.5 py-5">
              <div className="text-label font-bold text-neutral-500">최상위 중복 입찰</div>
              {payload.topDuplicates && payload.topDuplicates.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  {payload.topDuplicates.map((duplicate) => (
                    <div
                      key={`${duplicate.price}-${duplicate.cnt}`}
                      className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm"
                    >
                      <span className="font-bold text-neutral-100">{formatPrice(duplicate.price)}</span>
                      <span className="text-neutral-400">{duplicate.cnt}명 중복</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-label leading-6 text-neutral-400">중복 입찰 정보가 없습니다.</p>
              )}
            </div>
          )}

          <button
            className="mt-2 flex w-full items-center justify-center rounded-(--radius-panel) bg-point px-4 py-3 text-sub-lg text-background transition hover:opacity-90"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
