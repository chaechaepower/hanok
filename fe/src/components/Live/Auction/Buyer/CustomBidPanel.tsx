import { FiMinus, FiPlus } from 'react-icons/fi';

import type { BidState } from '@/hooks/useBidState';
import { CUSTOM_UNIT_OPTIONS } from '@/hooks/useBidState';

interface Props {
  bid: BidState;
}

export default function CustomBidPanel({ bid }: Props) {
  return (
    <div className="flex flex-1 gap-1">
      <div className="flex w-1/2 flex-col gap-2">
        <div className="flex rounded-lg bg-neutral-900 p-0.5">
          {CUSTOM_UNIT_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`flex-1 rounded-md py-1.5 text-caption font-bold transition ${
                bid.activeCustomUnit === option.value ? 'bg-gold text-neutral-100' : 'text-neutral-500'
              }`}
              onClick={() => bid.setCustomUnit(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center gap-2">
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
              value={bid.freeInput}
              onChange={(event) => bid.handleFreeInput(event.target.value)}
              placeholder="입찰가 입력"
              className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-neutral-100 outline-none placeholder:text-neutral-600"
            />
          ) : (
            <div className="min-w-0 flex-1 text-center text-sm font-black tabular-nums text-neutral-100">
              {bid.hasActiveAuction ? (
                <>
                  {bid.effectiveBidAmount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-neutral-400">원</span>
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
        className="flex flex-1 items-center rounded-xl bg-gold px-3 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
        onClick={bid.handleBidPlace}
        disabled={bid.isBidDisabled}
      >
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-lg font-black">입찰</span>
          {bid.hasActiveAuction && (
            <>
              <span className="text-caption font-bold tabular-nums text-gold-light">
                {bid.effectiveBidAmount.toLocaleString()}원
              </span>
              <span className="text-caption font-bold text-gold">+{bid.increment.toLocaleString()}</span>
            </>
          )}
        </div>
        <span className="rounded bg-warm/15 px-1.5 py-3 text-caption font-bold text-gold-light">
          ENTER
        </span>
      </button>
    </div>
  );
}
