import { DURATION_LABELS } from '@/constants/auction';
import type { AuctionDuration } from '@/types';
import { useState } from 'react';

type ItemStatus = 'waiting' | 'active' | 'sold' | 'unsold';
type ItemCondition = 'new' | 'like_new' | 'used';
type BidIncrement = 1000 | 5000 | 10000 | number;

interface Item {
  id: string;
  title: string;
  startPrice: number;
  condition: ItemCondition;
  auctionDuration: AuctionDuration;
  bidIncrement: BidIncrement;
  status: ItemStatus;
  imageUrl: string | null;
}

interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  cardBg: string;
  dot: string | null;
}

interface ItemCardProps {
  item: Item;
  isSelected: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
}

const STATUS_CONFIG: Record<ItemStatus, StatusConfig> = {
  waiting: {
    label: '대기중',
    badgeBg: 'bg-zinc-700',
    badgeText: 'text-zinc-300',
    borderColor: 'border-zinc-700/60',
    cardBg: 'bg-zinc-900',
    dot: null,
  },
  active: {
    label: '진행중',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    borderColor: 'border-amber-500/60',
    cardBg: 'bg-zinc-900',
    dot: 'animate-pulse bg-amber-400',
  },
  sold: {
    label: '낙찰',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    cardBg: 'bg-zinc-900/60',
    dot: null,
  },
  unsold: {
    label: '유찰',
    badgeBg: 'bg-zinc-800',
    badgeText: 'text-zinc-500',
    borderColor: 'border-zinc-800',
    cardBg: 'bg-zinc-900/40',
    dot: null,
  },
};

const CONDITION_LABEL: Record<ItemCondition, string> = {
  new: '미사용',
  like_new: '거의 새것',
  used: '중고',
};

function ItemCard({ item, isSelected, onSelect, disabled }: ItemCardProps) {
  const cfg = STATUS_CONFIG[item.status];
  const isActive = item.status === 'active';
  const isDimmed = item.status === 'sold' || item.status === 'unsold';

  const handleClick = () => {
    if (!disabled && !isDimmed) onSelect(item.id);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isDimmed}
      className={[
        'relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition-all duration-200',
        cfg.cardBg,
        cfg.borderColor,
        isSelected && !isDimmed ? 'ring-2 ring-amber-400/80 border-amber-400/60' : '',
        !disabled && !isDimmed ? 'cursor-pointer hover:brightness-110' : 'cursor-default',
        isDimmed ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isActive && <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-amber-400/20" />}

      <div className="relative shrink-0">
        <div
          className={[
            'flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border bg-zinc-800',
            isActive ? 'border-amber-500/40' : 'border-zinc-700/50',
          ].join(' ')}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className={['h-full w-full object-cover', isDimmed ? 'grayscale' : ''].join(' ')}
            />
          ) : (
            <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>

        {isSelected && !isDimmed && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-amber-400/20">
            <svg
              className="h-5 w-5 text-amber-400 drop-shadow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={['truncate text-sm font-semibold leading-tight', isDimmed ? 'text-zinc-500' : 'text-zinc-100'].join(
            ' ',
          )}
        >
          {item.title}
        </p>

        <p
          className={[
            'mt-0.5 text-sm font-bold',
            isActive ? 'text-amber-400' : isDimmed ? 'text-zinc-600' : 'text-zinc-200',
          ].join(' ')}
        >
          {item.startPrice.toLocaleString()}원
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
            {CONDITION_LABEL[item.condition]}
          </span>

          <span className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
              <path strokeLinecap="round" strokeWidth={2} d="M12 7v5l3 3" />
            </svg>
            {DURATION_LABELS[item.auctionDuration] ?? `${item.auctionDuration}초`}
          </span>

          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
            +{(item.bidIncrement / 1000).toFixed(0)}천원
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <span
          className={['flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold', cfg.badgeBg, cfg.badgeText].join(
            ' ',
          )}
        >
          {cfg.dot && <span className={['h-1.5 w-1.5 rounded-full', cfg.dot].join(' ')} />}
          {cfg.label}
        </span>
      </div>
    </button>
  );
}

const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    title: '청자 유각 천보문 향로',
    startPrice: 130000,
    condition: 'new',
    auctionDuration: 30,
    bidIncrement: 5000,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&q=80',
  },
  {
    id: '2',
    title: '고전 자수 병풍 세트',
    startPrice: 2450000,
    condition: 'like_new',
    auctionDuration: 60,
    bidIncrement: 10000,
    status: 'waiting',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&q=80',
  },
  {
    id: '3',
    title: '골동 가구 머릿장',
    startPrice: 850000,
    condition: 'used',
    auctionDuration: 30,
    bidIncrement: 5000,
    status: 'waiting',
    imageUrl: null,
  },
  {
    id: '4',
    title: '조선백자 사발 미니 컬렉션',
    startPrice: 320000,
    condition: 'new',
    auctionDuration: 10,
    bidIncrement: 1000,
    status: 'sold',
    imageUrl: 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=200&q=80',
  },
  {
    id: '5',
    title: '민화 화조도 액자',
    startPrice: 75000,
    condition: 'used',
    auctionDuration: 30,
    bidIncrement: 1000,
    status: 'unsold',
    imageUrl: null,
  },
];

export default function Demo() {
  const [selectedId, setSelectedId] = useState<string>('1');

  const activeItem = MOCK_ITEMS.find((item) => item.status === 'active') ?? null;
  const waitingItems = MOCK_ITEMS.filter((item) => item.status === 'waiting');
  const doneItems = MOCK_ITEMS.filter((item) => item.status === 'sold' || item.status === 'unsold');

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-950 px-4 py-10 font-['Noto_Sans_KR',sans-serif]">
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-100">오늘의 출품 목록</h2>
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-zinc-950">
              {MOCK_ITEMS.length}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span>
              대기 <strong className="text-zinc-300">{waitingItems.length}</strong>
            </span>
            <span>
              완료 <strong className="text-zinc-300">{doneItems.length}</strong>
            </span>
          </div>
        </div>

        {activeItem && (
          <section className="space-y-1.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">진행중</p>
            <ItemCard item={activeItem} isSelected={selectedId === activeItem.id} onSelect={setSelectedId} disabled={false} />
          </section>
        )}

        {waitingItems.length > 0 && (
          <section className="space-y-1.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              대기중 ({waitingItems.length})
            </p>
            <div className="space-y-2">
              {waitingItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={setSelectedId}
                  disabled={!!activeItem}
                />
              ))}
            </div>
          </section>
        )}

        {doneItems.length > 0 && (
          <section className="space-y-1.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              완료 ({doneItems.length})
            </p>
            <div className="space-y-2">
              {doneItems.map((item) => (
                <ItemCard key={item.id} item={item} isSelected={false} onSelect={() => {}} disabled={true} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
