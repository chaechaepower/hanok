import type { BidState } from '@/hooks/useBidState';

interface Props {
  bid: BidState;
}

export default function UniqueBidPanel({ bid }: Props) {
  return (
    <div className="flex flex-1 gap-1">
      <div className="flex w-1/2 flex-col gap-2">
        <div className="flex-1 rounded-md bg-neutral-800 px-3 py-1.5 text-center text-caption font-bold text-neutral-100">
          입찰 범위: {bid.uniqueMinPrice.toLocaleString()} ~ {bid.uniqueMaxPrice.toLocaleString()}원
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-neutral-900 px-2.5 py-1">
          <div className="flex min-h-8 shrink-0 flex-col justify-center rounded-lg bg-neutral-900 px-2.5 py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-caption text-neutral-500">잔고</span>
              <span className="text-xs font-bold tabular-nums text-neutral-100">
                {bid.balance.toLocaleString()}원
              </span>
            </div>
            {bid.isInsufficientBalance && (
              <span className="mt-1 text-caption font-bold text-accent-light">잔고 부족</span>
            )}
          </div>
          <div className="h-5 w-px bg-neutral-700" />
          <input
            type="text"
            inputMode="numeric"
            value={bid.freeInput}
            onChange={(event) => bid.handleFreeInput(event.target.value)}
            onBlur={bid.handleUniqueInputBlur}
            placeholder="입찰가 입력"
            disabled={bid.hasPlacedUniqueBid}
            className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-neutral-100 outline-none placeholder:text-neutral-600 disabled:cursor-not-allowed disabled:text-neutral-500"
          />
        </div>
      </div>

      <button
        type="button"
        className="flex flex-1 items-center rounded-xl bg-gold px-3 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
        onClick={bid.handleBidPlace}
        disabled={bid.isBidDisabled}
      >
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-lg font-black">{bid.hasPlacedUniqueBid ? '완료' : '입찰'}</span>
          {bid.freeInput ? (
            <span className="text-caption font-bold tabular-nums text-gold-light">
              {bid.effectiveBidAmount.toLocaleString()}원
            </span>
          ) : null}
          <span className="text-caption font-bold text-gold">
            {bid.hasPlacedUniqueBid ? '1회 입찰 완료' : '1회 입찰 가능'}
          </span>
        </div>
        <span className="rounded bg-warm/15 px-1.5 py-3 text-caption font-bold text-gold-light">
          ENTER
        </span>
      </button>
    </div>
  );
}
