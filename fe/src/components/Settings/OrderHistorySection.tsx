import { useState } from 'react';

import { useGetEscrowDetail } from '@/api/hooks/useGetEscrowDetail';
import { useGetEscrowsBuyer } from '@/api/hooks/useGetEscrowsBuyer';
import { usePostCompleteEscrow } from '@/api/hooks/usePostCompleteEscrow';
import EscrowDetailCard from '@/components/common/EscrowDetailCard';
import NftReceiptCard from '@/components/common/NftReceiptCard';
import NoItem from '@/components/common/NoItem';
import { useToast } from '@/hooks/useToast';
import type { EscrowStatusFilter } from '@/utils/getEscrowStateUI';

import OrderHistoryListItem from './orderHistory/OrderHistoryListItem';
import OrderHistorySummary from './orderHistory/OrderHistorySummary';
import OrderHistoryToolbar from './orderHistory/OrderHistoryToolbar';
import { getFilteredAndSortedEscrows, getOrderHistorySummary, type SortOption } from '../../utils/orderHistory';

export default function OrderHistorySection() {
  const { data: escrowsResponse } = useGetEscrowsBuyer();
  const { showToast } = useToast();
  const { mutateAsync: completeEscrow, isPending: isCompletingEscrow } = usePostCompleteEscrow();
  const items = escrowsResponse?.data || [];

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EscrowStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('LATEST');

  const { data: detailResponse, isLoading: isDetailLoading } = useGetEscrowDetail(selectedItemId);
  const selectedItemDetail = detailResponse?.data;
  const selectedEscrow = items.find((item) => String(item.escrowId) === selectedItemId) ?? null;
  const canCompletePurchase = selectedEscrow?.escrowStatus === 'SHIPPED';

  const { totalCount, totalAmount } = getOrderHistorySummary(items);
  const filteredAndSorted = getFilteredAndSortedEscrows(items, statusFilter, sortBy);

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
        <OrderHistorySummary totalCount={totalCount} totalAmount={totalAmount} />
        <OrderHistoryToolbar
          statusFilter={statusFilter}
          sortBy={sortBy}
          onChangeStatusFilter={setStatusFilter}
          onChangeSortBy={setSortBy}
        />

        {filteredAndSorted.length === 0 ? (
          <div className="rounded-2xl bg-surface-elevated px-8">
            <NoItem
              message={statusFilter === 'ALL' ? '구매 내역이 없습니다.' : '해당 상태의 주문이 없습니다.'}
              className="py-15"
              textClassName="text-[15px] text-neutral-500"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAndSorted.map((item) => (
              <OrderHistoryListItem key={item.escrowId} item={item} onSelect={setSelectedItemId} />
            ))}
          </div>
        )}
      </div>

      {selectedItemId && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            {isDetailLoading || !selectedItemDetail ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-surface-elevated p-8">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-gold-light" />
              </div>
            ) : (
              <EscrowDetailCard
                detail={selectedItemDetail}
                onClose={handleCloseModal}
                minHeightClassName="min-h-0"
                showHeaderCloseButton={false}
                footer={
                  <div className="mt-6 flex flex-col gap-3">
                    {selectedEscrow?.escrowStatus === 'COMPLETED' && <NftReceiptCard escrowId={selectedItemId} />}
                    <div className="flex gap-3">
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
