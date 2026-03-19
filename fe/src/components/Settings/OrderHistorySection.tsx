import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiGift } from 'react-icons/fi';
import { MdKeyboardArrowDown } from 'react-icons/md';

import { usePostCompleteEscrow } from '@/api/hooks/usePostCompleteEscrow';
import { useGetEscrowDetail } from '@/api/hooks/useGetEscrowDetail';
import { useGetEscrowsBuyer } from '@/api/hooks/useGetEscrowsBuyer';
import EscrowDetailCard from '@/components/common/EscrowDetailCard';
import { useToast } from '@/components/common/Toast';
import { ESCROW_STATUS_OPTIONS, getEscrowStateUI, type EscrowStatusFilter } from '@/utils/getEscrowStateUI';

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

type SortOption = 'LATEST' | 'AMOUNT';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'LATEST', label: '최신순' },
  { value: 'AMOUNT', label: '금액 높은순' },
];

export default function OrderHistorySection() {
  const { data: escrowsResponse } = useGetEscrowsBuyer();
  const { showToast } = useToast();
  const { mutateAsync: completeEscrow, isPending: isCompletingEscrow } = usePostCompleteEscrow();
  const items = escrowsResponse?.data || [];

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EscrowStatusFilter>('ALL');
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
  const selectedEscrow = items.find((item) => String(item.escrowId) === selectedItemId) ?? null;
  const canCompletePurchase = selectedEscrow?.escrowStatus === 'SHIPPED';

  const totalCount = items.length;
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const filteredItems = statusFilter === 'ALL' ? items : items.filter((item) => item.escrowStatus === statusFilter);
  const filteredAndSorted =
    sortBy === 'LATEST'
      ? [...filteredItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : [...filteredItems].sort((a, b) => b.amount - a.amount);

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? '';

  const handleCloseModal = () => {
    setSelectedItemId(null);
  };

  const handleCompletePurchase = async () => {
    if (!selectedItemId || !canCompletePurchase) {
      return;
    }

    try {
      await completeEscrow(selectedItemId);
      showToast({ message: '구매 확정이 완료되었습니다.' });
    } catch (error) {
      console.error('[escrow] failed to complete purchase', error);
      showToast({ message: '구매 확정 처리에 실패했습니다.' });
    }
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
            {ESCROW_STATUS_OPTIONS.map((option) => {
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
                  className="flex cursor-pointer items-center justify-between rounded-2xl border-none bg-surface-elevated px-6 py-5 text-left transition-colors hover:bg-surface"
                >
                  <div className="flex flex-1 items-center gap-6">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-neutral-700 bg-surface">
                      {item.image ? (
                        <img src={item.image} alt={item.itemName} className="h-full w-full object-cover" />
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

                  <div className="flex w-35 flex-col items-end gap-1.5">
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
          <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            {isDetailLoading || !selectedItemDetail ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-surface-elevated p-8">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-gold-light" />
              </div>
            ) : (
              <EscrowDetailCard
                detail={selectedItemDetail}
                onClose={handleCloseModal}
                counterpartyLabel="판매자"
                minHeightClassName="min-h-0"
                showHeaderCloseButton={false}
                footer={
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 rounded-2xl border border-neutral-700 bg-transparent py-3 text-sm font-bold text-neutral-300 transition hover:bg-warm/10"
                    >
                      닫기
                    </button>
                    {canCompletePurchase && (
                      <button
                        type="button"
                        onClick={() => void handleCompletePurchase()}
                        disabled={isCompletingEscrow}
                        className="flex-1 rounded-2xl bg-gold py-3 text-sm font-bold text-background transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        구매확정
                      </button>
                    )}
                  </div>
                }
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
