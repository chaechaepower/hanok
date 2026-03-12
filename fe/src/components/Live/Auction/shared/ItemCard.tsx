import { useState } from 'react';

// ─────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────

type ItemStatus = 'waiting' | 'active' | 'sold' | 'unsold';
type ItemCondition = 'new' | 'like_new' | 'used';
type AuctionDuration = 10 | 30 | 60 | 600;
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

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────

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
  new: '새상품',
  like_new: '거의새것',
  used: '중고',
};

const DURATION_LABEL: Record<number, string> = {
  10: '10초',
  30: '30초',
  60: '1분',
  600: '10분',
};

// ─────────────────────────────────────────
// ItemCard 컴포넌트
// ─────────────────────────────────────────

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
        'w-full text-left rounded-xl border transition-all duration-200',
        'flex items-center gap-3 px-3 py-3 relative overflow-hidden',
        cfg.cardBg,
        cfg.borderColor,
        isSelected && !isDimmed ? 'ring-2 ring-amber-400/80 border-amber-400/60' : '',
        !disabled && !isDimmed ? 'hover:brightness-110 cursor-pointer' : 'cursor-default',
        isDimmed ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 진행중 glow */}
      {isActive && <span className="absolute inset-0 rounded-xl ring-1 ring-amber-400/20 pointer-events-none" />}

      {/* 썸네일 */}
      <div className="relative shrink-0">
        <div
          className={[
            'w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-800 border',
            isActive ? 'border-amber-500/40' : 'border-zinc-700/50',
          ].join(' ')}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className={['w-full h-full object-cover', isDimmed ? 'grayscale' : ''].join(' ')}
            />
          ) : (
            <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>

        {/* 선택 체크 오버레이 */}
        {isSelected && !isDimmed && (
          <span className="absolute inset-0 rounded-lg bg-amber-400/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-400 drop-shadow"
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

      {/* 정보 영역 */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm font-semibold truncate leading-tight',
            isDimmed ? 'text-zinc-500' : 'text-zinc-100',
          ].join(' ')}
        >
          {item.title}
        </p>

        <p
          className={[
            'text-sm font-bold mt-0.5',
            isActive ? 'text-amber-400' : isDimmed ? 'text-zinc-600' : 'text-zinc-200',
          ].join(' ')}
        >
          {item.startPrice.toLocaleString()}원
        </p>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {CONDITION_LABEL[item.condition]}
          </span>

          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
              <path strokeLinecap="round" strokeWidth={2} d="M12 7v5l3 3" />
            </svg>
            {DURATION_LABEL[item.auctionDuration] ?? `${item.auctionDuration}초`}
          </span>

          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            +{(item.bidIncrement / 1000).toFixed(0)}천원
          </span>
        </div>
      </div>

      {/* 상태 뱃지 */}
      <div className="shrink-0">
        <span
          className={[
            'flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full',
            cfg.badgeBg,
            cfg.badgeText,
          ].join(' ')}
        >
          {cfg.dot && <span className={['w-1.5 h-1.5 rounded-full', cfg.dot].join(' ')} />}
          {cfg.label}
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────
// 데모
// ─────────────────────────────────────────

const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    title: '청자 투각 철보문 피로',
    startPrice: 130000,
    condition: 'new',
    auctionDuration: 30,
    bidIncrement: 5000,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&q=80',
  },
  {
    id: '2',
    title: '전통 자수 병풍 세트',
    startPrice: 2450000,
    condition: 'like_new',
    auctionDuration: 60,
    bidIncrement: 10000,
    status: 'waiting',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&q=80',
  },
  {
    id: '3',
    title: '고가구 머릿장',
    startPrice: 850000,
    condition: 'used',
    auctionDuration: 30,
    bidIncrement: 5000,
    status: 'waiting',
    imageUrl: null,
  },
  {
    id: '4',
    title: '조선백자 달항아리 미니어처',
    startPrice: 320000,
    condition: 'new',
    auctionDuration: 10,
    bidIncrement: 1000,
    status: 'sold',
    imageUrl: 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=200&q=80',
  },
  {
    id: '5',
    title: '민화 호랑이 액자',
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

  const activeItem = MOCK_ITEMS.find((i) => i.status === 'active') ?? null;
  const waitingItems = MOCK_ITEMS.filter((i) => i.status === 'waiting');
  const doneItems = MOCK_ITEMS.filter((i) => i.status === 'sold' || i.status === 'unsold');

  return (
    <div
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
      className="min-h-screen bg-zinc-950 flex items-start justify-center py-10 px-4"
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="w-full max-w-sm space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-100">오늘의 출품 목록</h2>
            <span className="text-[11px] font-bold bg-amber-500 text-zinc-950 rounded-full px-2 py-0.5">
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

        {/* 진행중 섹션 */}
        {activeItem && (
          <section className="space-y-1.5">
            <p className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-widest px-1">● 진행중</p>
            <ItemCard
              item={activeItem}
              isSelected={selectedId === activeItem.id}
              onSelect={setSelectedId}
              disabled={false}
            />
          </section>
        )}

        {/* 대기중 섹션 */}
        {waitingItems.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
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

        {/* 완료 섹션 */}
        {doneItems.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-1">
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
