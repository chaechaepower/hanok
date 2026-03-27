import { FiMinus, FiPlus } from 'react-icons/fi';

import type { BidState } from '@/hooks/useBidState';
import { CUSTOM_UNIT_OPTIONS } from '@/hooks/useBidState';
import { formatNumericInputValue } from '@/utils/formatNumericInputValue';

interface Props {
  bid: BidState;
}

export default function CustomBidPanel({ bid }: Props) {
  return (
    <div className="flex min-h-[74px] min-w-0 flex-1 items-stretch gap-1">
      <div className="flex min-w-0 flex-[1.3] self-stretch flex-col gap-1.5">
        <div className="flex rounded-lg bg-neutral-900 p-0.5">
          {CUSTOM_UNIT_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`flex-1 rounded-md py-1 text-caption font-bold transition ${
                bid.activeCustomUnit === option.value ? 'bg-gold text-neutral-100' : 'text-neutral-500'
              }`}
              onClick={() => bid.setCustomUnit(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2">
          <div className="flex min-h-8 min-w-0 shrink flex-col justify-center rounded-lg bg-neutral-900 px-2.5 py-1">
            <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
              <span className="shrink-0 text-caption text-neutral-500">잔고</span>
              <span className="min-w-0 truncate text-xs font-bold tabular-nums text-neutral-100">
                {bid.balance.toLocaleString()}원
              </span>
            </div>
            {bid.isInsufficientBalance && (
              <span className="mt-1 whitespace-nowrap text-caption font-bold text-accent-light">잔고 부족</span>
            )}
          </div>

          <div className="h-5 w-px shrink-0 bg-neutral-700" />

          <button
            type="button"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
              bid.isFreeMode
                ? 'bg-neutral-900 text-neutral-600'
                : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
            }`}
            onClick={bid.handleDecrease}
            disabled={bid.isFreeMode}
          >
            <FiMinus size={12} />
          </button>

          {bid.isFreeMode ? (
            <input
              type="text"
              inputMode="numeric"
              value={formatNumericInputValue(bid.freeInput)}
              onChange={(event) => bid.handleFreeInput(event.target.value)}
              placeholder="입찰가 직접 입력"
              className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-neutral-100 outline-none placeholder:text-neutral-600"
            />
          ) : (
            <div className="min-w-0 flex-1 truncate text-center text-sm font-black tabular-nums text-neutral-100">
              {bid.hasActiveAuction ? (
                <>
                  {bid.effectiveBidAmount.toLocaleString()} <span className="text-xs font-normal text-neutral-400">원</span>
                </>
              ) : null}
            </div>
          )}

          <button
            type="button"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
              bid.isFreeMode
                ? 'bg-neutral-900 text-neutral-600'
                : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
            }`}
            onClick={bid.handleIncrease}
            disabled={bid.isFreeMode}
          >
            <FiPlus size={12} />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="flex min-w-0 flex-[0.8] self-stretch items-center rounded-xl bg-gold px-2.5 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
        onClick={bid.handleBidPlace}
        disabled={bid.isBidDisabled}
      >
        <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
          <span className="whitespace-nowrap text-lg font-black">입찰</span>
          {bid.hasActiveAuction && (
            <>
              <span className="truncate text-caption font-bold tabular-nums text-gold-light">
                {bid.effectiveBidAmount.toLocaleString()}원
              </span>
              <span className="whitespace-nowrap text-caption font-bold text-gold">+{bid.increment.toLocaleString()}</span>
            </>
          )}
        </div>
        <span className="shrink-0 rounded bg-warm/15 px-1.5 py-2.5 text-caption font-bold text-gold-light">ENTER</span>
      </button>
    </div>
  );
}
