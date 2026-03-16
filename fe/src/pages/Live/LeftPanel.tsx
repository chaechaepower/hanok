import { useState } from 'react';

import type { ItemSyncItem } from '@/types';

import { ActiveItemCard, DoneItemCard } from './AuctionItemCard';
import AuctionReportModal from './AuctionReportModal';

export type ItemStatus = ItemSyncItem['auctionStatus'];
export type ItemCondition = ItemSyncItem['itemCondition'];

export interface AuctionItem {
  id: number;
  name: string;
  startPrice: number;
  finalPrice?: number;
  status: ItemStatus;
  auctionType: ItemSyncItem['auctionType'];
  condition: ItemCondition;
  thumbnailUrl?: string;
  description?: string;
  bidUnit?: number;
  auctionTime?: number;
  images?: string[];
}

interface Props {
  isSeller: boolean;
  syncedItems?: ItemSyncItem[] | null;
  selectedAuctionId?: number | null;
  onSelectAuctionItem?: (auctionId: number | null) => void;
}

const ACTIVE_STATUS_PRIORITY: Record<Exclude<ItemStatus, 'SOLD' | 'UNSOLD'>, number> = {
  INTRODUCING: 0,
  LIVE: 0,
  READY: 1,
};

function toAuctionItems(items: ItemSyncItem[]): AuctionItem[] {
  return items.map((item) => ({
    id: item.auctionId,
    name: item.itemName,
    startPrice: item.startPrice,
    finalPrice: item.finalPrice ?? undefined,
    status: item.auctionStatus,
    auctionType: item.auctionType,
    condition: item.itemCondition,
    thumbnailUrl: item.images?.[0] ?? item.image ?? undefined,
    description: item.description,
    bidUnit: item.bidUnit,
    auctionTime: item.auctionTime,
    images: item.images,
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
      <div className="flex h-full w-full flex-col rounded-2xl bg-background px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-400">경매 물품 목록</span>
          <span className="text-[11px] font-bold text-neutral-600">{totalCount}</span>
        </div>

        <div className="left-panel-scroll flex flex-1 flex-col gap-2 overflow-y-auto pr-2">
          {activeItems.map((item) => (
            <ActiveItemCard
              key={item.id}
              item={item}
              isSelected={isSeller && selectedAuctionId === item.id}
              isSeller={isSeller}
              onSelect={() => onSelectAuctionItem?.(item.id)}
            />
          ))}

          {isSeller && doneItems.length > 0 && (
            <>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">종료</span>
                <div className="h-px flex-1 bg-gradient-to-r from-neutral-800 to-transparent" />
              </div>

              {doneItems.map((item) => (
                <DoneItemCard key={item.id} item={item} />
              ))}
            </>
          )}
        </div>

        {isSeller && (
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-transparent px-4 py-2.5 text-xs font-bold text-neutral-500 transition-all hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-300"
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
