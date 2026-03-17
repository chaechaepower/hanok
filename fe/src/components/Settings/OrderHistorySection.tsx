import { useState } from 'react';
import { FiGift } from 'react-icons/fi';

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

export default function OrderHistorySection() {
  const { data: escrowsResponse } = useGetEscrowsBuyer();
  const items = escrowsResponse?.data || [];

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { data: detailResponse, isLoading: isDetailLoading } = useGetEscrowDetail(selectedItemId);
  const selectedItemDetail = detailResponse?.data;

  const handleCloseModal = () => {
    setSelectedItemId(null);
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {items.length === 0 ? (
          <p className="text-center text-neutral-600 py-15 text-[15px]">구매 내역이 없습니다.</p>
        ) : (
          items.map((item, index) => {
            const ui = getEscrowStateUI(item.escrowStatus);

            return (
              <button
                key={item.escrowId}
                type="button"
                onClick={() => item.escrowId && setSelectedItemId(String(item.escrowId))}
                className={`flex py-4 items-center justify-between text-left bg-transparent border-none cursor-pointer rounded-2xl px-2 transition-colors hover:bg-surface ${
                  index > 0 ? 'border-t border-neutral-800 mt-4 pt-8' : ''
                }`}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-16 h-16 rounded-full bg-surface border-[1.5px] border-gold-light flex items-center justify-center overflow-hidden">
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
          })
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
              <div className="bg-surface-elevated rounded-3xl p-8 border border-neutral-700 min-h-[320px] flex items-center justify-center">
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
