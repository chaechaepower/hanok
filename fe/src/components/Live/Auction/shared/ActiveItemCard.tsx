import { useState } from 'react';
import { IoChevronDown } from 'react-icons/io5';

import { AUCTION_STATUS_BADGES } from '@/constants/auction';
import { ITEM_CONDITION_BADGE } from '@/constants/itemCondition';
import { CARD_BORDER_CLASS, PRICE_CLASS } from '@/constants/live';

import type { AuctionItem } from '@/types';
import { formatAuctionLabel } from '@/utils/formatAuctionLabel';
import ItemDetailAccordion from './ItemDetailAccordion';

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
    ? 'border-gold/55 shadow-primary-glow'
    : CARD_BORDER_CLASS[item.status];

  const handleCardClick = () => {
    if (isSeller) {
      onSelect?.();
      return;
    }

    setExpanded((prev) => !prev);
  };

  return (
    <div
      className={`flex cursor-pointer flex-col rounded-(--radius-panel) border bg-surface p-3.5 transition-all duration-200 ${borderClass}`}
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        {item.thumbnailUrl ? (
          <div
            className="h-16 w-16 shrink-0 rounded-(--radius-control) bg-neutral-800 bg-cover bg-center"
            style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-(--radius-control) bg-neutral-800" />
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <span className="truncate text-xs font-bold leading-snug text-white">{item.name}</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`text-body-md font-black ${PRICE_CLASS[item.status]}`}>{formatAuctionLabel(item)}</span>
            <span
              className={`shrink-0 rounded-full bg-gold/[0.08] px-1.5 py-0.5 text-caption font-extrabold ${conditionBadge.className}`}
            >
              {conditionBadge.label}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-2">
          <span className={`rounded-full px-1.5 py-0.5 text-caption font-extrabold ${statusBadge.className}`}>
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
            <IoChevronDown
              size={12}
              className={`text-neutral-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isExpanded && <ItemDetailAccordion item={item} />}
    </div>
  );
}
