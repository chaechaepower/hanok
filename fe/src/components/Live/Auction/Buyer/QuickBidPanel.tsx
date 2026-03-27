import { IoCheckmark } from 'react-icons/io5';

import type { BidState } from '@/hooks/useBidState';

interface Props {
  bid: BidState;
}

export default function QuickBidPanel({ bid }: Props) {
  return (
    <div className="flex min-h-[74px] min-w-0 flex-1 items-stretch gap-2">
      <div className="flex min-w-0 flex-[0.72] self-stretch flex-col items-center justify-center rounded-lg bg-neutral-900 px-2.5 py-1">
        <div className="flex min-w-0 items-center gap-4 whitespace-nowrap">
          <span className="shrink-0 text-caption text-neutral-500">잔고</span>
          <span className="min-w-0 truncate text-xs font-bold tabular-nums text-neutral-100">
            {bid.balance.toLocaleString()}원
          </span>
        </div>
        {bid.isInsufficientBalance && (
          <span className="mt-1 whitespace-nowrap text-caption font-bold text-accent-light">잔고 부족</span>
        )}
      </div>

      <button
        type="button"
        className="flex min-w-0 flex-[1.28] self-stretch items-center rounded-xl bg-gold px-3 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
        onClick={bid.handleBidPlace}
        disabled={bid.isBidDisabled}
      >
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div className="flex min-w-0 items-center gap-2 text-sm font-black">
            <IoCheckmark size={16} strokeWidth={4} className="shrink-0" />
            <span className="min-w-0 truncate">
              {bid.hasActiveAuction ? `${bid.effectiveBidAmount.toLocaleString()}원으로 입찰` : '입찰'}
            </span>
          </div>
          {bid.hasActiveAuction && (
            <span className="whitespace-nowrap text-xs font-bold text-gold-light">
              (+{bid.increment.toLocaleString()})
            </span>
          )}
        </div>
        <span className="shrink-0 rounded bg-warm/15 px-1.5 py-2.5 text-caption font-bold text-gold-light">ENTER</span>
      </button>
    </div>
  );
}
