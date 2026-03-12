import { useEffect } from 'react';

import type { AuctionItem, ItemStatus } from './LeftPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  items: AuctionItem[];
}

const STATUS_BADGE: Record<ItemStatus, { label: string; text: string; bg: string }> = {
  READY: { label: '대기', text: '#71717A', bg: 'rgba(113,113,122,0.15)' },
  INTRODUCING: { label: '설명중', text: '#93C5FD', bg: 'rgba(59,130,246,0.12)' },
  LIVE: { label: '경매중', text: '#C5A059', bg: 'rgba(197,160,89,0.12)' },
  SOLD: { label: '낙찰', text: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  UNSOLD: { label: '유찰', text: '#F87171', bg: 'rgba(248,113,113,0.12)' },
};

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR');
}

export default function AuctionReportModal({ open, onClose, items }: Props) {
  const doneItems = items.filter((item) => item.status === 'SOLD' || item.status === 'UNSOLD');
  const remainItems = items.filter((item) => item.status !== 'SOLD' && item.status !== 'UNSOLD');
  const totalSales = doneItems.reduce((sum, item) => sum + (item.finalPrice ?? 0), 0);
  const avgSales = doneItems.length > 0 ? Math.round(totalSales / doneItems.length) : 0;
  const progressPct = items.length > 0 ? (doneItems.length / items.length) * 100 : 0;

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-250"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[80vh] w-130 flex-col overflow-hidden rounded-[28px] bg-[#0E0E10]"
        style={{
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          transform: open ? 'translateY(0)' : 'translateY(16px)',
          transition: 'transform 0.25s',
        }}
      >
        <div
          className="flex shrink-0 items-start justify-between px-7 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div>
            <h2 className="text-base font-black tracking-tight text-white">오늘의 경매 리포트</h2>
            <p className="mt-1 text-[11px] font-medium text-[#52525B]">{dateStr}</p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[rgba(255,255,255,0.1)]"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="#71717A" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        <div className="left-panel-scroll flex flex-col gap-5 overflow-y-auto p-7">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '전체 물품 수', value: items.length, color: '#A1A1AA', sub: '등록된 경매 물품' },
              { label: '종료 물품 수', value: doneItems.length, color: '#C5A059', sub: '낙찰 또는 유찰' },
              { label: '진행 물품 수', value: remainItems.length, color: '#1DFD6D', sub: '대기, 설명, 경매중' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 rounded-[20px] p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B]">{stat.label}</span>
                <span className="text-[26px] font-black leading-none" style={{ color: stat.color }}>
                  {stat.value}
                </span>
                <span className="text-[10px] font-medium text-[#52525B]">{stat.sub}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#71717A]">종료 진행률</span>
              <span className="text-[11px] font-semibold text-[#71717A]">
                {doneItems.length} / {items.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
              <div
                className="h-full rounded-full transition-all duration-600"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(to right, #8B6914, #C5A059)',
                }}
              />
            </div>
          </div>

          <div
            className="flex items-center justify-between rounded-[20px] px-5 py-4"
            style={{ background: 'rgba(197,160,89,0.05)', border: '1px solid rgba(197,160,89,0.12)' }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-[#52525B]">총 낙찰 금액</span>
              <span className="text-2xl font-black text-[#C5A059]">{formatPrice(totalSales)}원</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-bold text-[#52525B]">평균 낙찰가</span>
              <span className="text-base font-black text-[rgba(197,160,89,0.7)]">{formatPrice(avgSales)}원</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#52525B]">
                경매 물품 목록
              </span>
            </div>

            {items.map((item, index) => {
              const statusBadge = STATUS_BADGE[item.status];
              const isDone = item.status === 'SOLD' || item.status === 'UNSOLD';

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 py-2.5"
                  style={{
                    borderBottom: index < items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  }}
                >
                  <span className="w-5 text-[11px] font-bold text-[#3F3F46]">{index + 1}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                    style={{ color: statusBadge.text, background: statusBadge.bg }}
                  >
                    {statusBadge.label}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-bold ${isDone ? 'text-[#52525B] line-through' : 'text-white'}`}
                  >
                    {item.name}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-medium text-[#52525B]">
                      시작가 {formatPrice(item.startPrice)}원
                    </span>
                    {isDone && item.finalPrice ? (
                      <span className="text-xs font-black text-[#C5A059]">{formatPrice(item.finalPrice)}원</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#3F3F46]">
                        {item.status === 'LIVE' || item.status === 'INTRODUCING' ? '진행중' : '대기'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
