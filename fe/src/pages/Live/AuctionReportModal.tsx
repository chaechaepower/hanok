import { useEffect } from 'react';

import { AUCTION_STATUS_BADGES } from '@/constants/auction';
import type { AuctionItem } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

interface Props {
  open: boolean;
  onClose: () => void;
  items: AuctionItem[];
}

const STAT_COLORS = ['text-neutral-400', 'text-gold', 'text-ember'] as const;

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
      className={`fixed inset-0 z-100 flex items-center justify-center bg-black/75 backdrop-blur-[12px] transition-opacity duration-250 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`flex max-h-[80vh] w-130 flex-col overflow-hidden rounded-[28px] border border-white/7 bg-surface shadow-[0_32px_80px_rgba(0,0,0,0.6)] transition-transform duration-250 ${open ? 'translate-y-0' : 'translate-y-4'}`}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-white/5 px-7 pt-6 pb-5">
          <div>
            <h2 className="text-base font-black tracking-tight text-white">오늘의 경매 리포트</h2>
            <p className="mt-1 text-[11px] font-medium text-neutral-600">{dateStr}</p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            onClick={onClose}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              stroke="currentColor"
              className="text-neutral-500"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        <div className="left-panel-scroll flex flex-col gap-5 overflow-y-auto p-7">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '전체 물품 수', value: items.length, sub: '등록된 경매 물품' },
              { label: '종료 물품 수', value: doneItems.length, sub: '낙찰 또는 유찰' },
              { label: '진행 물품 수', value: remainItems.length, sub: '대기, 설명, 경매중' },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 rounded-[20px] border border-white/6 bg-white/[0.02] p-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">{stat.label}</span>
                <span className={`text-[26px] font-black leading-none ${STAT_COLORS[idx]}`}>{stat.value}</span>
                <span className="text-[10px] font-medium text-neutral-600">{stat.sub}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-500">종료 진행률</span>
              <span className="text-[11px] font-semibold text-neutral-500">
                {doneItems.length} / {items.length}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-bar progress-bar-gold" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[20px] border border-gold/12 bg-gold/5 px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-neutral-600">총 낙찰 금액</span>
              <span className="text-2xl font-black text-gold">{formatPrice(totalSales)}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-bold text-neutral-600">평균 낙찰가</span>
              <span className="text-base font-black text-gold/70">{formatPrice(avgSales)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="border-b border-white/4 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-600">
                경매 물품 목록
              </span>
            </div>

            {items.map((item, index) => {
              const statusBadge = AUCTION_STATUS_BADGES[item.status];
              const isDone = item.status === 'SOLD' || item.status === 'UNSOLD';

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3.5 py-2.5 ${index < items.length - 1 ? 'border-b border-white/3' : ''}`}
                >
                  <span className="w-5 text-[11px] font-bold text-neutral-700">{index + 1}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-bold ${isDone ? 'text-neutral-600 line-through' : 'text-white'}`}
                  >
                    {item.name}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-medium text-neutral-600">
                      시작가 {formatPrice(item.startPrice)}
                    </span>
                    {isDone && item.finalPrice ? (
                      <span className="text-xs font-black text-gold">{formatPrice(item.finalPrice)}</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-neutral-700">
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
