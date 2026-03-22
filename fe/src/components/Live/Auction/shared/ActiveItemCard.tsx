import { useState } from 'react';

import { AUCTION_STATUS_BADGES } from '@/constants/auction';
import { ITEM_CONDITION_BADGE } from '@/constants/itemCondition';
import { CARD_BORDER_CLASS, PRICE_CLASS } from '@/constants/live';

import type { AuctionItem } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import ItemDetailAccordion from './ItemDetailAccordion';

const formatAuctionLabel = (item: AuctionItem) =>
  item.auctionType === 'UNIQUE_TOP'
    ? item.minPrice !== null && item.maxPrice !== null && item.maxPrice > item.minPrice
      ? `${formatPrice(item.minPrice)} ~ ${formatPrice(item.maxPrice)}`
      : formatPrice(item.minPrice ?? 0)
    : formatPrice(item.startPrice ?? 0);

interface ActiveCardProps {
  item: AuctionItem;
  isSelected: boolean;
  isSeller: boolean;
  onSelect?: () => void;
}

export default function ActiveItemCard({ item, isSelected, isSeller, onSelect }: ActiveCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusBadge = AUCTION_STATUS_BADGES[item.status];
  const conditionBadge = ITEM_CONDITION_BADGE[item.condition];
  const isExpanded = isSeller ? isSelected : expanded;
  const borderClass = isSelected
    ? 'border-gold/55 shadow-[0_0_12px_rgba(205,145,80,0.15)]'
    : `${CARD_BORDER_CLASS[item.status]} ${item.status === 'LIVE' ? 'shadow-[0_0_12px_rgba(205,145,80,0.1)]' : ''}`;

  const handleCardClick = () => {
    if (isSeller) {
      onSelect?.();
      return;
    }

    setExpanded((prev) => !prev);
  };

  return (
    <div
      className={`flex cursor-pointer flex-col rounded-[20px] border bg-white/[0.02] p-3.5 transition-all duration-200 ${borderClass}`}
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
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
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`text-[13px] font-black ${PRICE_CLASS[item.status]}`}>{formatAuctionLabel(item)}</span>
            <span
              className={`shrink-0 rounded-full bg-gold/[0.08] px-1.5 py-0.5 text-[9px] font-extrabold ${conditionBadge.className}`}
            >
              {conditionBadge.label}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-1">
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <button
            type="button"
            className="rounded-full p-0.5 transition-colors hover:bg-white/10"
            onClick={(event) => {
              event.stopPropagation();
              if (isSeller) {
                onSelect?.();
                return;
              }

              setExpanded((prev) => !prev);
            }}
          >
            <svg
              className={`h-3 w-3 text-neutral-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
          </button>
        </div>
      </div>

      {isExpanded && <ItemDetailAccordion item={item} />}
    </div>
  );
}
