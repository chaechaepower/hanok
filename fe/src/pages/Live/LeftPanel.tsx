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

const STATUS_BADGE: Record<ItemStatus, { label: string; text: string; bg: string; border: string }> = {
  READY: { label: '대기', text: '#71717A', bg: 'rgba(113,113,122,0.15)', border: 'rgba(113,113,122,0.3)' },
  INTRODUCING: { label: '설명중', text: '#93C5FD', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  LIVE: { label: '경매중', text: '#C5A059', bg: 'rgba(197,160,89,0.12)', border: 'rgba(197,160,89,0.4)' },
  SOLD: { label: '낙찰', text: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
  UNSOLD: { label: '유찰', text: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
};

const CONDITION_BADGE: Record<ItemCondition, { label: string; color: string }> = {
  BRAND_NEW: { label: '미개봉 세제품', color: 'rgba(255,220,140,0.95)' },
  OPEN_BOX: { label: '개봉된 새상품', color: 'rgba(220,185,120,0.85)' },
  REFURBISHED: { label: '리퍼비시', color: 'rgba(180,150,100,0.7)' },
  USED: { label: '중고', color: 'rgba(140,130,115,0.65)' },
};

const PRICE_COLOR: Record<ItemStatus, string> = {
  READY: '#71717A',
  INTRODUCING: '#93C5FD',
  LIVE: '#C5A059',
  SOLD: '#52525B',
  UNSOLD: '#52525B',
};

const CARD_BORDER: Record<ItemStatus, string> = {
  READY: 'rgba(255,255,255,0.06)',
  INTRODUCING: 'rgba(255,255,255,0.06)',
  LIVE: 'rgba(197,160,89,0.5)',
  SOLD: 'rgba(255,255,255,0.06)',
  UNSOLD: 'rgba(255,255,255,0.06)',
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
      <div
        className="flex h-full w-full flex-col rounded-2xl bg-[#050505] px-4 py-6"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-[#A1A1AA]">경매 물품 목록</span>
          <span className="text-[11px] font-bold text-[#52525B]">{totalCount}</span>
        </div>

        <div className="left-panel-scroll flex flex-1 flex-col gap-2 overflow-y-auto pr-2">
          {activeItems.map((item) => {
            const isSelected = isSeller && selectedAuctionId === item.id;
            const statusBadge = STATUS_BADGE[item.status];
            const conditionBadge = CONDITION_BADGE[item.condition];

            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-[20px] p-3.5 transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(197,160,89,0.55)' : CARD_BORDER[item.status]}`,
                  boxShadow: isSelected
                    ? '0 0 12px rgba(197,160,89,0.15)'
                    : item.status === 'LIVE'
                      ? '0 0 12px rgba(197,160,89,0.1)'
                      : 'none',
                  cursor: isSeller ? 'pointer' : 'default',
                  pointerEvents: isSeller ? 'all' : 'none',
                }}
                onClick={isSeller ? () => onSelectAuctionItem?.(selectedAuctionId === item.id ? null : item.id) : undefined}
              >
                <div
                  className="h-16 w-16 shrink-0 rounded-[14px] bg-[#27272A]"
                  style={
                    item.thumbnailUrl
                      ? {
                          backgroundImage: `url(${item.thumbnailUrl})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : undefined
                  }
                />

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <span className="truncate text-xs font-bold leading-snug text-white">{item.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-black" style={{ color: PRICE_COLOR[item.status] }}>
                      {formatPrice(item.startPrice)}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                      style={{ color: conditionBadge.color, background: 'rgba(197,160,89,0.08)' }}
                    >
                      {conditionBadge.label}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-center">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                    style={{
                      color: statusBadge.text,
                      background: statusBadge.bg,
                      border: `1px solid ${statusBadge.border}`,
                    }}
                  >
                    {statusBadge.label}
                  </span>
                </div>
              </div>
            );
          })}

          {isSeller && doneItems.length > 0 && (
            <>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F3F46]">종료</span>
                <div
                  className="h-px flex-1"
                  style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.06), transparent)' }}
                />
              </div>

              {doneItems.map((item) => {
                const statusBadge = STATUS_BADGE[item.status];

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-[20px] p-3.5"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      opacity: 0.45,
                      cursor: 'default',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      className="h-16 w-16 shrink-0 rounded-[14px] bg-[#27272A] opacity-40"
                      style={
                        item.thumbnailUrl
                          ? {
                              backgroundImage: `url(${item.thumbnailUrl})`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }
                          : undefined
                      }
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                      <span className="truncate text-xs font-bold leading-snug text-[#71717A]">{item.name}</span>
                      <span className="text-[13px] font-black text-[#52525B] line-through">
                        {formatPrice(item.startPrice)}
                      </span>
                      {item.finalPrice && (
                        <span className="text-xs font-black text-[rgba(197,160,89,0.7)]">
                          낙찰가 {formatPrice(item.finalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center">
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                        style={{
                          color: statusBadge.text,
                          background: statusBadge.bg,
                          border: `1px solid ${statusBadge.border}`,
                        }}
                      >
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-transparent px-4 py-2.5 text-xs font-bold text-[#71717A] transition-all hover:border-[rgba(255,255,255,0.12)] hover:bg-[#18181B] hover:text-[#D4D4D8]"
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
