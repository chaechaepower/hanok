import { useState } from 'react';

import type { ItemSyncItem } from '@/types';

import AuctionReportModal from './AuctionReportModal';

export type ItemStatus = ItemSyncItem['auctionStatus'];
export type ItemCondition = ItemSyncItem['itemCondition'];

export interface AuctionItem {
  id: number;
  name: string;
  startPrice: number;
  finalPrice?: number;
  status: ItemStatus;
  condition: ItemCondition;
  thumbnailUrl?: string;
}

interface Props {
  isSeller: boolean;
  syncedItems?: ItemSyncItem[] | null;
  selectedAuctionId?: number | null;
  onSelectAuctionItem?: (auctionId: number | null) => void;
}

const STATUS_BADGE: Record<ItemStatus, { label: string; className: string }> = {
  READY: { label: '대기', className: 'text-neutral-500 bg-neutral-500/15 border border-neutral-500/30' },
  INTRODUCING: { label: '설명중', className: 'text-primary-light bg-primary/12 border border-primary/30' },
  LIVE: { label: '경매중', className: 'text-gold bg-gold/12 border border-gold/40' },
  SOLD: { label: '낙찰', className: 'text-white bg-gold border border-gold' },
  UNSOLD: { label: '유찰', className: 'text-accent-light bg-accent/12 border border-accent/30' },
};

const CONDITION_BADGE: Record<ItemCondition, { label: string; className: string }> = {
  BRAND_NEW: { label: '미개봉 세제품', className: 'text-gold-light' },
  OPEN_BOX: { label: '개봉된 새상품', className: 'text-gold' },
  REFURBISHED: { label: '리퍼비시', className: 'text-gold-dark' },
  USED: { label: '중고', className: 'text-gold-muted' },
};

const PRICE_CLASS: Record<ItemStatus, string> = {
  READY: 'text-neutral-500',
  INTRODUCING: 'text-primary-light',
  LIVE: 'text-gold',
  SOLD: 'text-neutral-600',
  UNSOLD: 'text-neutral-600',
};

const CARD_BORDER_CLASS: Record<ItemStatus, string> = {
  READY: 'border-white/6',
  INTRODUCING: 'border-white/6',
  LIVE: 'border-gold/50',
  SOLD: 'border-white/6',
  UNSOLD: 'border-white/6',
};

const ACTIVE_STATUS_PRIORITY: Record<Exclude<ItemStatus, 'SOLD' | 'UNSOLD'>, number> = {
  INTRODUCING: 0,
  LIVE: 0,
  READY: 1,
};

function formatPrice(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}

function toAuctionItems(items: ItemSyncItem[]): AuctionItem[] {
  return items.map((item) => ({
    id: item.auctionId,
    name: item.itemName,
    startPrice: item.startPrice,
    finalPrice: item.finalPrice ?? undefined,
    status: item.auctionStatus,
    condition: item.itemCondition,
    thumbnailUrl: item.image || undefined,
  }));
}

export default function LeftPanel({
  isSeller,
  syncedItems = null,
  selectedAuctionId = null,
  onSelectAuctionItem,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const items: AuctionItem[] = syncedItems ? toAuctionItems(syncedItems) : [];

  const activeItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status !== 'SOLD' && item.status !== 'UNSOLD')
    .sort((a, b) => {
      const priorityDiff =
        ACTIVE_STATUS_PRIORITY[a.item.status as Exclude<ItemStatus, 'SOLD' | 'UNSOLD'>] -
        ACTIVE_STATUS_PRIORITY[b.item.status as Exclude<ItemStatus, 'SOLD' | 'UNSOLD'>];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return a.index - b.index;
    })
    .map(({ item }) => item);
  const doneItems = items.filter((item) => item.status === 'SOLD' || item.status === 'UNSOLD');
  const totalCount = items.length;

  return (
    <>
      <div className="flex h-full w-full flex-col rounded-2xl border-r border-white/5 bg-background px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-400">경매 물품 목록</span>
          <span className="text-[11px] font-bold text-neutral-600">{totalCount}</span>
        </div>

        <div className="left-panel-scroll flex flex-1 flex-col gap-2 overflow-y-auto pr-2">
          {activeItems.map((item) => {
            const isSelected = isSeller && selectedAuctionId === item.id;
            const statusBadge = STATUS_BADGE[item.status];
            const conditionBadge = CONDITION_BADGE[item.condition];
            const borderClass = isSelected ? 'border-gold/55 shadow-[0_0_12px_rgba(205,145,80,0.15)]' : `${CARD_BORDER_CLASS[item.status]} ${item.status === 'LIVE' ? 'shadow-[0_0_12px_rgba(205,145,80,0.1)]' : ''}`;

            return (
              <div
                key={item.id}
                className={`flex gap-3 rounded-[20px] border bg-white/[0.02] p-3.5 transition-all duration-200 ${borderClass} ${isSeller ? 'cursor-pointer' : 'pointer-events-none'}`}
                onClick={isSeller ? () => onSelectAuctionItem?.(selectedAuctionId === item.id ? null : item.id) : undefined}
              >
                {item.thumbnailUrl ? (
                  <div
                    className="h-16 w-16 shrink-0 rounded-[14px] bg-neutral-800 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-[14px] bg-neutral-800" />
                )}

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <span className="truncate text-xs font-bold leading-snug text-white">{item.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[13px] font-black ${PRICE_CLASS[item.status]}`}>
                      {formatPrice(item.startPrice)}
                    </span>
                    <span className={`rounded-full bg-gold/[0.08] px-1.5 py-0.5 text-[9px] font-extrabold ${conditionBadge.className}`}>
                      {conditionBadge.label}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>
            );
          })}

          {isSeller && doneItems.length > 0 && (
            <>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">종료</span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/6 to-transparent" />
              </div>

              {doneItems.map((item) => {
                const statusBadge = STATUS_BADGE[item.status];

                return (
                  <div
                    key={item.id}
                    className="pointer-events-none flex gap-3 rounded-[20px] border border-white/6 bg-white/[0.02] p-3.5 opacity-45"
                  >
                    {item.thumbnailUrl ? (
                      <div
                        className="h-16 w-16 shrink-0 rounded-[14px] bg-neutral-800 bg-cover bg-center opacity-40"
                        style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-[14px] bg-neutral-800 opacity-40" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                      <span className="truncate text-xs font-bold leading-snug text-neutral-500">{item.name}</span>
                      <span className="text-[13px] font-black text-neutral-600 line-through">
                        {formatPrice(item.startPrice)}
                      </span>
                      {item.finalPrice && (
                        <span className="text-xs font-black text-gold/70">
                          낙찰가 {formatPrice(item.finalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {isSeller && (
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/7 bg-transparent px-4 py-2.5 text-xs font-bold text-neutral-500 transition-all hover:border-white/12 hover:bg-neutral-900 hover:text-neutral-300"
            onClick={() => setModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            경매 리포트
          </button>
        )}
      </div>

      {isSeller && <AuctionReportModal open={modalOpen} onClose={() => setModalOpen(false)} items={items} />}
    </>
  );
}
