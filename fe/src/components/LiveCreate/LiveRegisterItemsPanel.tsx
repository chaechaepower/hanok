import { FaTimes } from 'react-icons/fa';

import ActiveItemCard from '@/components/Live/Auction/shared/ActiveItemCard';
import CustomSelect from '@/components/common/CustomSelect';
import { AUCTION_TYPE_SELECT_OPTIONS, DURATION_SELECT_OPTIONS } from '@/constants/auction';
import { getItemConditionLabel } from '@/constants/itemCondition';
import { LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM } from '@/constants/live';
import type { Product } from '@/types';

import type { LiveRegisterTutorialStepId } from './LiveRegisterTutorial';
import {
  auctionInputClassName,
  type AuctionFieldErrors,
  type AuctionNumberField,
  toPreviewAuctionItem,
} from '../../utils/liveRegister';

type Props = {
  activeStepId?: LiveRegisterTutorialStepId | null;
  tutorialVisibleItems: Product[];
  tutorialItemRef: React.RefObject<HTMLDivElement | null>;
  getTargetClassName: (targetId: LiveRegisterTutorialStepId) => string;
  auctionFieldErrors: AuctionFieldErrors;
  onToggleItem: (item: Product) => void;
  onAuctionTypeChange: (itemId: number, auctionType: Product['auctionType']) => void;
  onAuctionDurationChange: (itemId: number, duration: number) => void;
  onAuctionFieldChange: (itemId: number, field: AuctionNumberField, rawValue: string) => void;
  onAuctionFieldBlur: (item: Product, field: AuctionNumberField) => void;
  onOpenInventory: () => void;
};

export default function LiveRegisterItemsPanel({
  activeStepId,
  tutorialVisibleItems,
  tutorialItemRef,
  getTargetClassName,
  auctionFieldErrors,
  onToggleItem,
  onAuctionTypeChange,
  onAuctionDurationChange,
  onAuctionFieldChange,
  onAuctionFieldBlur,
  onOpenInventory,
}: Props) {
  return (
    <aside className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background">
      <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
        <span className="text-sm font-bold text-white">경매 물품 목록</span>
        <span className="text-[13px] font-bold text-gold-light/70">{tutorialVisibleItems.length}개</span>
      </div>

      <div className="left-panel-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5">
        {tutorialVisibleItems.map((item, index) => {
          const conditionLabel = getItemConditionLabel(item.itemCondition);
          const isTutorialFocusItem = activeStepId === 'inventory' && index === 0;
          const isExampleItem = item.itemId === LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM.itemId;

          return (
            <div
              key={`${item.itemId}-${index}`}
              ref={isTutorialFocusItem ? tutorialItemRef : undefined}
              className={isTutorialFocusItem ? getTargetClassName('inventory') : ''}
            >
              {isExampleItem ? (
                <ActiveItemCard item={toPreviewAuctionItem(item)} isSelected={false} isSeller={false} />
              ) : (
                <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-white/[0.02] p-4">
                  <div className="flex gap-3">
                    <div
                      className="h-14 w-14 shrink-0 rounded-xl bg-neutral-800"
                      style={
                        item.images && item.images.length > 0
                          ? {
                              backgroundImage: `url(${item.images[0]})`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }
                          : undefined
                      }
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                      <span className="truncate text-sm font-bold leading-snug text-neutral-100">{item.name}</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-extrabold text-gold-light">
                          {conditionLabel}
                        </span>
                        <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[11px] font-extrabold text-neutral-500">
                          {item.auctionType === 'UNIQUE_TOP' ? '유일 최고가' : '상향식'}
                        </span>
                        <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[11px] font-extrabold text-neutral-500">
                          {item.auctionDuration ?? 60}초
                        </span>
                        {isExampleItem && (
                          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-extrabold text-accent-light">
                            예시
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center">
                      {!isExampleItem && (
                        <button
                          type="button"
                          onClick={() => onToggleItem(item)}
                          className="cursor-pointer border-none bg-transparent p-1 text-xs text-neutral-500 hover:text-accent-light transition-colors"
                        >
                          <FaTimes size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          경매 방식
                        </span>
                        <CustomSelect
                          value={item.auctionType ?? 'BOTTOM_UP'}
                          onChange={(value) => onAuctionTypeChange(item.itemId, value as Product['auctionType'])}
                          options={AUCTION_TYPE_SELECT_OPTIONS}
                          descriptionPlacement="right"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          경매 시간
                        </span>
                        <CustomSelect
                          value={String(item.auctionDuration ?? 60)}
                          onChange={(value) => onAuctionDurationChange(item.itemId, Number(value))}
                          options={DURATION_SELECT_OPTIONS}
                        />
                      </div>
                    </div>

                    {item.auctionType === 'UNIQUE_TOP' ? (
                      <div className="mt-3">
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                              최소 입찰가
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.minPrice ?? ''}
                              onChange={(event) => onAuctionFieldChange(item.itemId, 'minPrice', event.target.value)}
                              onBlur={() => onAuctionFieldBlur(item, 'minPrice')}
                              placeholder="최소 입찰가 입력"
                              className={auctionInputClassName}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                              최대 입찰가
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.maxPrice ?? ''}
                              onChange={(event) => onAuctionFieldChange(item.itemId, 'maxPrice', event.target.value)}
                              onBlur={() => onAuctionFieldBlur(item, 'maxPrice')}
                              placeholder="최대 입찰가 입력"
                              className={auctionInputClassName}
                            />
                          </div>
                        </div>
                        {(auctionFieldErrors[item.itemId]?.minPrice || auctionFieldErrors[item.itemId]?.maxPrice) && (
                          <p className="mt-1.5 text-[11px] font-bold text-accent-light">
                            {auctionFieldErrors[item.itemId]?.minPrice ?? auctionFieldErrors[item.itemId]?.maxPrice}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className="flex flex-col gap-3">
                          <div className="group/starttip relative flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                              시작가
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.startPrice ?? ''}
                              onChange={(event) => onAuctionFieldChange(item.itemId, 'startPrice', event.target.value)}
                              onBlur={() => onAuctionFieldBlur(item, 'startPrice')}
                              placeholder="시작가 입력"
                              className={`${auctionInputClassName} ${auctionFieldErrors[item.itemId]?.startPrice ? 'animate-pulse border-red-400/60 bg-red-400/5' : ''}`}
                            />
                            <div className="pointer-events-none absolute top-full left-0 z-30 mt-1 hidden whitespace-nowrap rounded-lg bg-neutral-800 px-3 py-2 text-[11px] text-neutral-300 shadow-lg group-hover/starttip:block">
                              최소 1,000원 이상
                              <div className="absolute bottom-full left-4 border-4 border-transparent border-b-neutral-800" />
                            </div>
                          </div>
                          <div className="group/tip relative flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                              입찰 단위
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.bidUnit ?? ''}
                              onChange={(event) => onAuctionFieldChange(item.itemId, 'bidUnit', event.target.value)}
                              onBlur={() => onAuctionFieldBlur(item, 'bidUnit')}
                              placeholder="입찰 단위 입력"
                              className={`${auctionInputClassName} ${auctionFieldErrors[item.itemId]?.bidUnit ? 'animate-pulse border-red-400/60 bg-red-400/5' : ''}`}
                            />
                            <div className="pointer-events-none absolute top-full left-0 z-30 mt-1 hidden whitespace-nowrap rounded-lg bg-neutral-800 px-3 py-2 text-[11px] text-neutral-300 shadow-lg group-hover/tip:block">
                              <span className="block">최소 100원</span>
                              <span className="block">최대 시작가의 10%</span>
                              <div className="absolute bottom-full left-4 border-4 border-transparent border-b-neutral-800" />
                            </div>
                          </div>
                        </div>
                        {auctionFieldErrors[item.itemId]?.startPrice && (
                          <p className="mt-1.5 text-[11px] font-bold text-accent-light">
                            {auctionFieldErrors[item.itemId]?.startPrice}
                          </p>
                        )}
                        {auctionFieldErrors[item.itemId]?.bidUnit && (
                          <p className="mt-1.5 flex items-center gap-1 whitespace-pre-line text-[11px] font-bold text-red-400">
                            <span>⚠</span> {auctionFieldErrors[item.itemId]?.bidUnit}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

        <button
          type="button"
          onClick={onOpenInventory}
          className="mx-auto mb-2 mt-1 flex w-4/5 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-white/[0.02] py-2.5 text-[13px] font-bold text-neutral-400 transition-all hover:border-gold/40 hover:bg-gold/[0.06] hover:text-gold"
        >
          물품 선택
        </button>
    </aside>
  );
}
