import { useState } from 'react';

import type { AuctionItem, ItemCondition, ItemStatus } from './LeftPanel';

const STATUS_BADGE: Record<ItemStatus, { label: string; className: string }> = {
  READY: { label: '대기', className: 'badge-neutral' },
  INTRODUCING: { label: '설명중', className: 'badge-primary-outline' },
  LIVE: { label: '경매중', className: 'badge-gold-outline' },
  SOLD: { label: '낙찰', className: 'badge-ember-outline' },
  UNSOLD: { label: '유찰', className: 'badge-accent-outline' },
};

const CONDITION_BADGE: Record<ItemCondition, { label: string; className: string }> = {
  BRAND_NEW: { label: '미개봉', className: 'text-gold-light' },
  OPEN_BOX: { label: '개봉품', className: 'text-gold' },
  REFURBISHED: { label: '리퍼', className: 'text-gold-dark' },
  USED: { label: '중고', className: 'text-gold-muted' },
};

const AUCTION_TYPE_LABEL: Record<AuctionItem['auctionType'], string> = {
  BOTTOM_UP: '상향식',
  UNIQUE_TOP: '유일최고가',
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

function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatAuctionTime(seconds: number) {
  if (seconds >= 60) {
    return `${seconds / 60}분`;
  }

  return `${seconds}초`;
}

function ItemDetailAccordion({ item }: { item: AuctionItem }) {
  const hasDetail =
    item.description || item.bidUnit || item.auctionTime || item.auctionType || (item.images && item.images.length > 0);

  if (!hasDetail) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col gap-2.5 border-t border-white/6 pt-2.5">
      {(item.bidUnit || item.auctionTime || item.auctionType) && (
        <div className="flex flex-wrap gap-3">
          {item.auctionTime && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-neutral-600">경매 시간</span>
              <span className="text-[11px] font-extrabold text-gold-dark">{formatAuctionTime(item.auctionTime)}</span>
            </div>
          )}
          {item.bidUnit && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-neutral-600">입찰 단위</span>
              <span className="text-[11px] font-extrabold text-gold-dark">{formatPrice(item.bidUnit)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-neutral-600">경매 방식</span>
            <span className="text-[11px] font-extrabold text-gold-dark">{AUCTION_TYPE_LABEL[item.auctionType]}</span>
          </div>
        </div>
      )}

      {item.description && <p className="text-[11px] leading-relaxed text-neutral-500">{item.description}</p>}

      {item.images && item.images.length > 0 && (
        <div className="flex gap-1.5">
          {item.images.map((src, index) => (
            <div
              key={index}
              className="h-16 w-16 shrink-0 rounded-lg bg-neutral-800 bg-cover bg-center"
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ActiveCardProps {
  item: AuctionItem;
  isSelected: boolean;
  isSeller: boolean;
  onSelect?: () => void;
}

export function ActiveItemCard({ item, isSelected, isSeller, onSelect }: ActiveCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusBadge = STATUS_BADGE[item.status];
  const conditionBadge = CONDITION_BADGE[item.condition];
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
            <span className={`text-[13px] font-black ${PRICE_CLASS[item.status]}`}>{formatPrice(item.startPrice)}</span>
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

interface DoneCardProps {
  item: AuctionItem;
}

export function DoneItemCard({ item }: DoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusBadge = STATUS_BADGE[item.status];

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
          <span className="text-[13px] font-black text-neutral-600 line-through">{formatPrice(item.startPrice)}</span>
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
