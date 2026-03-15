import type { AuctionItem, ItemCondition, ItemStatus } from './LeftPanel';

const STATUS_BADGE: Record<ItemStatus, { label: string; className: string }> = {
  READY: { label: '대기', className: 'badge-neutral' },
  INTRODUCING: { label: '설명중', className: 'badge-primary-outline' },
  LIVE: { label: '경매중', className: 'badge-gold-outline' },
  SOLD: { label: '낙찰', className: 'badge-ember-outline' },
  UNSOLD: { label: '유찰', className: 'badge-accent-outline' },
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

function formatPrice(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}

interface ActiveCardProps {
  item: AuctionItem;
  isSelected: boolean;
  isSeller: boolean;
  onSelect?: () => void;
}

export function ActiveItemCard({ item, isSelected, isSeller, onSelect }: ActiveCardProps) {
  const statusBadge = STATUS_BADGE[item.status];
  const conditionBadge = CONDITION_BADGE[item.condition];
  const borderClass = isSelected
    ? 'border-gold/55 shadow-[0_0_12px_rgba(205,145,80,0.15)]'
    : `${CARD_BORDER_CLASS[item.status]} ${item.status === 'LIVE' ? 'shadow-[0_0_12px_rgba(205,145,80,0.1)]' : ''}`;

  return (
    <div
      className={`flex gap-3 rounded-[20px] border bg-white/[0.02] p-3.5 transition-all duration-200 ${borderClass} ${isSeller ? 'cursor-pointer' : 'pointer-events-none'}`}
      onClick={isSeller ? onSelect : undefined}
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
}

interface DoneCardProps {
  item: AuctionItem;
}

export function DoneItemCard({ item }: DoneCardProps) {
  const statusBadge = STATUS_BADGE[item.status];

  return (
    <div className="pointer-events-none flex gap-3 rounded-[20px] border border-white/6 bg-white/[0.02] p-3.5 opacity-45">
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
}
