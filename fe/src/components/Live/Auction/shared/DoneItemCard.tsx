import { useState } from 'react';

import { AUCTION_STATUS_BADGES } from '@/constants/auction';

import ItemDetailAccordion from './ItemDetailAccordion';
import type { AuctionItem } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

const formatAuctionLabel = (item: AuctionItem) =>
  item.auctionType === 'UNIQUE_TOP'
    ? item.minPrice !== null && item.maxPrice !== null && item.maxPrice > item.minPrice
      ? `${formatPrice(item.minPrice)} ~ ${formatPrice(item.maxPrice)}`
      : formatPrice(item.minPrice ?? 0)
    : formatPrice(item.startPrice ?? 0);

export default function DoneItemCard({ item }: { item: AuctionItem }) {
  const [expanded, setExpanded] = useState(false);
  const statusBadge = AUCTION_STATUS_BADGES[item.status];

  return (
    <div
      className="flex cursor-pointer flex-col rounded-[20px] border border-white/6 bg-white/[0.02] p-3.5 opacity-45"
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="flex gap-3">
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
          <span className="text-[13px] font-black text-neutral-600 line-through">{formatAuctionLabel(item)}</span>
          {item.finalPrice && (
            <span className="text-xs font-black text-gold/70">낙찰가 {formatPrice(item.finalPrice)}</span>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center gap-1">
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <svg
            className={`h-3 w-3 text-neutral-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {expanded && <ItemDetailAccordion item={item} />}
    </div>
  );
}
