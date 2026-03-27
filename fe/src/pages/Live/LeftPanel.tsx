import { useMemo, useState } from 'react';

import type { AuctionItem, ItemStatus, ItemSyncItem } from '@/types';

import AuctionReportModal from './AuctionReportModal';
import ActiveItemCard from '@/components/Live/Auction/shared/ActiveItemCard';
import DoneItemCard from '@/components/Live/Auction/shared/DoneItemCard';

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
    bidUnit: item.bidUnit,
    minPrice: item.minPrice,
    maxPrice: item.maxPrice,
    finalPrice: item.finalPrice ?? undefined,
    status: item.auctionStatus,
    auctionType: item.auctionType,
    condition: item.itemCondition,
    thumbnailUrl: item.images?.[0] ?? undefined,
    description: item.description,
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
  const items = useMemo<AuctionItem[]>(
    () => (syncedItems ? toAuctionItems(syncedItems) : []),
    [syncedItems],
  );

  const activeItems = useMemo(
    () =>
      items
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
        .map(({ item }) => item),
    [items],
  );
  const doneItems = useMemo(
    () => items.filter((item) => item.status === 'SOLD' || item.status === 'UNSOLD'),
    [items],
  );
  const totalCount = items.length;

  return (
    <>
      <div className="flex h-full w-full flex-col bg-background">
        <div className="mb-4 flex items-center justify-between px-4 pt-6">
          <span className="text-base font-bold text-neutral-300">경매 물품 목록</span>
          <span className="text-body-sm font-bold text-neutral-500">{totalCount}</span>
        </div>

        <div className="left-panel-scroll flex flex-1 flex-col gap-2 overflow-y-auto px-4">
          {activeItems.map((item) => (
            <ActiveItemCard
              key={item.id}
              item={item}
              isSelected={isSeller && selectedAuctionId === item.id}
              isSeller={isSeller}
              onSelect={() => onSelectAuctionItem?.(selectedAuctionId === item.id ? null : item.id)}
            />
          ))}

          {doneItems.length > 0 && (
            <>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-caption font-bold uppercase tracking-wider text-neutral-700">종료</span>
                <div className="h-px flex-1 bg-gradient-to-r from-neutral-800 to-transparent" />
              </div>

              {doneItems.map((item) => (
                <DoneItemCard key={item.id} item={item} />
              ))}
            </>
          )}
        </div>

        {isSeller && (
          <div className="border-t border-neutral-800 bg-background px-4 py-3.5">
            <button
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-bold text-neutral-400 transition-all hover:bg-neutral-800 hover:text-neutral-200"
              onClick={() => setModalOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              경매 리포트
            </button>
          </div>
        )}
      </div>

      {isSeller && <AuctionReportModal open={modalOpen} onClose={() => setModalOpen(false)} items={items} />}
    </>
  );
}
