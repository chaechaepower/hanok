import { useEffect, useMemo, useRef, useState } from 'react';
import { FiGift } from 'react-icons/fi';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { motion } from 'framer-motion';

import { useGetEscrowDetail } from '@/api/hooks/useGetEscrowDetail';
import { useGetEscrowsBuyer } from '@/api/hooks/useGetEscrowsBuyer';
import EscrowDetailCard from '@/components/common/EscrowDetailCard';
import type { EscrowState } from '@/types';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${min}`;
};

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

const getEscrowStateUI = (state: EscrowState) => {
  switch (state) {
    case 'INVOICE_SUBMITTED':
      return {
        label: '배송중',
        badgeClass: 'self-start badge badge-ember-outline',
      };
    case 'COMPLETED':
      return {
        label: '배송완료',
        badgeClass: 'self-start badge badge-primary-outline',
      };
    case 'CANCELLED':
      return {
        label: '취소됨',
        badgeClass: 'self-start badge badge-neutral',
      };
    case 'DEPOSITED':
    default:
      return {
        label: '결제완료',
        badgeClass: 'self-start badge badge-gold-outline',
      };
  }
};

type StatusFilter = EscrowState | 'ALL';
type SortOption = 'LATEST' | 'AMOUNT';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'DEPOSITED', label: '결제완료' },
  { value: 'INVOICE_SUBMITTED', label: '배송중' },
  { value: 'COMPLETED', label: '배송완료' },
  { value: 'CANCELLED', label: '취소됨' },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'LATEST', label: '최신순' },
  { value: 'AMOUNT', label: '금액 높은순' },
];

export default function OrderHistorySection() {
  const { data: escrowsResponse } = useGetEscrowsBuyer();
  const items = escrowsResponse?.data || [];

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('LATEST');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!sortDropdownRef.current?.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const { data: detailResponse, isLoading: isDetailLoading } = useGetEscrowDetail(selectedItemId);
  const selectedItemDetail = detailResponse?.data;

  const totalCount = items.length;
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const filteredAndSorted = useMemo(() => {
    let result = statusFilter === 'ALL' ? items : items.filter((item) => item.escrowStatus === statusFilter);

    if (sortBy === 'LATEST') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result = [...result].sort((a, b) => b.amount - a.amount);
    }

    return result;
  }, [items, statusFilter, sortBy]);

  const selectedSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? '';

  const handleCloseModal = () => {
    setSelectedItemId(null);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6 rounded-2xl bg-surface-elevated px-8 py-6">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-neutral-500">총 주문</span>
            <span className="text-[20px] font-bold text-white">{totalCount}건</span>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-neutral-500">총 결제 금액</span>
            <span className="text-[20px] font-bold text-gold-light">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative inline-flex items-center rounded-xl bg-warm/6 p-1">
            {STATUS_OPTIONS.map((option) => {
              const isSelected = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className="relative z-10 rounded-lg px-4 py-2 text-subtitle-sm transition"
                >
                  {isSelected && (
                    <motion.span
                      layoutId="orderStatusTab"
                      initial={false}
                      className="absolute inset-0 rounded-lg bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${isSelected ? 'text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div ref={sortDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary/15 px-4 py-2 transition hover:bg-primary/25"
            >
              <span className="text-body-md font-semibold text-primary-light">{selectedSortLabel}</span>
              <span className={`text-caption text-point/70 transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>
                <MdKeyboardArrowDown />
              </span>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-full overflow-hidden rounded-[10px] bg-primary/15 p-1 shadow-primary-glow backdrop-blur-md">
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sortBy === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-center text-body-md transition ${
                        isSelected ? 'bg-primary font-semibold text-neutral-100' : 'text-neutral-300 hover:bg-warm/10'
                      }`}
                    >
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div className="rounded-2xl bg-surface-elevated px-8 py-15 text-center">
            <p className="text-[15px] text-neutral-500">
              {statusFilter === 'ALL' ? '구매 내역이 없습니다.' : '해당 상태의 주문이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAndSorted.map((item) => {
              const ui = getEscrowStateUI(item.escrowStatus);

              return (
                <button
                  key={item.escrowId}
                  type="button"
                  onClick={() => item.escrowId && setSelectedItemId(String(item.escrowId))}
                  className="flex items-center justify-between rounded-2xl bg-surface-elevated px-6 py-5 text-left transition-colors hover:bg-surface cursor-pointer border-none"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-16 h-16 rounded-full bg-surface border-[1.5px] border-neutral-700 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <FiGift size={32} className="text-gold-light" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className={ui.badgeClass}>{ui.label}</span>
                      <h4 className="m-0 mt-0.5 text-base font-bold text-white">{item.itemName}</h4>
                      <p className="m-0 text-[13px] text-neutral-600">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 w-35">
                    <span className="text-base font-bold text-white">- {formatPrice(item.amount)}</span>
                    <span className="text-[13px] text-neutral-600">{ui.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedItemId && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            {isDetailLoading || !selectedItemDetail ? (
              <div className="bg-surface-elevated rounded-3xl p-8 min-h-[320px] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-neutral-700 border-t-gold-light rounded-full animate-spin" />
              </div>
            ) : (
              <EscrowDetailCard
                detail={selectedItemDetail}
                onClose={handleCloseModal}
                counterpartyLabel="판매자"
                minHeightClassName="min-h-0"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
