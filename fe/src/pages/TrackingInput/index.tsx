import { useState, useRef, useEffect } from 'react';
import { BsBox } from 'react-icons/bs';
import { FiX } from 'react-icons/fi';

import { usePostCancelEscrow } from '@/api/hooks/usePostCancelEscrow';
import { useGetEscrowDetail } from '@/api/hooks/useGetEscrowDetail';
import { useGetEscrowsSeller } from '@/api/hooks/useGetEscrowsSeller';
import { validateTrackingInput } from '@/api/hooks/useGetTracking';
import { usePostTrackingInfo } from '@/api/hooks/usePostTrackingInfo';
import EscrowDetailCard from '@/components/common/EscrowDetailCard';
import SideBar from '@/components/common/layouts/SideBar';
import { CARRIERS } from '@/constants/sellerRegister';
import type { EscrowItem } from '@/types';
import {
  getEscrowStateUI,
  isCancelledEscrowState,
  isPendingEscrowState,
  isTrackingSubmittedEscrowState,
} from '@/utils/getEscrowStateUI';
import { formatDateTime } from '@/utils/formatDateTime';
import { formatPrice } from '@/utils/formatPrice';
import { useToast } from '@/hooks/useToast';
import { sellerSidebarItems } from '@/constants/sidebar';

function CompletedItemRow({
  item,
  isSelected,
  onSelect,
  formatPrice,
}: {
  item: EscrowItem;
  isSelected: boolean;
  onSelect: () => void;
  formatPrice: (price: number) => string;
}) {
  return (
    <div>
      <div
        onClick={onSelect}
        className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-colors ${
          isSelected
            ? 'bg-surface border border-neutral-700'
            : 'bg-transparent border border-transparent hover:bg-surface/60'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className="w-[80px] h-[80px] bg-neutral-800 rounded-xl overflow-hidden shrink-0">
            {item.image ? (
              <img src={item.image} alt={item.itemName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                이미지 준비중
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gold-light text-xs font-bold">{getEscrowStateUI(item.escrowStatus).label}</span>
            <span className="text-lg font-bold text-neutral-100">{item.itemName}</span>
            <span className="text-neutral-400 text-[13px]">{formatDateTime(item.createdAt)}</span>
          </div>
        </div>
        <div className="text-lg font-bold text-neutral-100">{formatPrice(item.amount)}</div>
      </div>
    </div>
  );
}

function CancelModal({
  itemName,
  onConfirm,
  onClose,
}: {
  itemName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-elevated rounded-2xl p-[40px_32px_32px] w-[360px] relative shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col items-center gap-5"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-neutral-500 p-1"
        >
          <FiX size={20} />
        </button>

        <div className="w-14 h-14 rounded-full bg-accent-muted flex items-center justify-center">
          <FiX size={28} className="text-accent-light" />
        </div>

        <h2 className="text-xl font-bold text-neutral-100 m-0">거래를 취소하시겠습니까?</h2>

        <div className="flex items-center gap-2.5 bg-neutral-800 rounded-(--radius-control) p-[12px_16px] w-full">
          <BsBox size={18} className="text-neutral-500" />
          <span className="text-[15px] text-neutral-100 font-medium">{itemName}</span>
        </div>

        <div className="w-full flex flex-col gap-2">
          <label className="text-[13px] text-neutral-500 font-medium">취소 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="취소 사유를 입력해주세요."
            rows={4}
            className="w-full p-3.5 text-sm text-neutral-100 border border-neutral-700 rounded-(--radius-control) resize-none outline-none font-[inherit] box-border bg-surface leading-[1.6]"
          />
        </div>

        <button
          type="button"
          onClick={() => onConfirm(reason)}
          className="btn-primary w-full h-[52px] rounded-xl text-base font-semibold cursor-pointer"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function TrackingInput() {
  const [activeMenu, setActiveMenu] = useState('delivery');
  const { data: escrowsResponse } = useGetEscrowsSeller();
  const items = escrowsResponse?.data || [];

  const { mutate: submitTracking } = usePostTrackingInfo();
  const { mutate: cancelEscrow } = usePostCancelEscrow();
  const { showToast } = useToast();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const carrierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCarrierModal) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (carrierDropdownRef.current && !carrierDropdownRef.current.contains(e.target as Node)) {
        setShowCarrierModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCarrierModal]);

  const currentSelectedItem = items.find((item) => String(item.escrowId) === selectedItemId);
  const isTrackingSubmitted = currentSelectedItem
    ? isTrackingSubmittedEscrowState(currentSelectedItem.escrowStatus)
    : false;

  const { data: detailResponse } = useGetEscrowDetail(selectedItemId);
  const selectedItemDetail = detailResponse?.data;

  const pendingItems = items.filter((item) => isPendingEscrowState(item.escrowStatus));
  const completedItems = items.filter((item) => isTrackingSubmittedEscrowState(item.escrowStatus));
  const cancelledItems = items.filter((item) => isCancelledEscrowState(item.escrowStatus));

  const handleSelectItem = (id: string | number | undefined) => {
    if (!id) return;

    setSelectedItemId(String(id));
    setCarrier('');
    setCarrierName('');
    setTrackingNumber('');
  };

  const handleCancelConfirm = (cancelReason: string) => {
    if (!selectedItemId) return;
    const normalizedReason = cancelReason.trim();

    if (!normalizedReason) {
      showToast({ type: 'warning', message: '취소 사유를 입력해 주세요.' });
      return;
    }

    cancelEscrow(
      { escrowId: selectedItemId, cancelReason: normalizedReason },
      {
        onSuccess: () => {
          setShowCancelModal(false);
          showToast({ type: 'success', message: '거래가 취소되었습니다.' });
          setSelectedItemId(null);
        },
        onError: () => {
          setShowCancelModal(false);
          showToast({ type: 'error', message: '거래 취소에 실패했습니다. 다시 시도해주세요.' });
        },
      },
    );
  };

  return (
    <>
      {showCancelModal && selectedItemDetail && (
        <CancelModal
          itemName={selectedItemDetail.winningInfo.itemName}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      <div className="flex gap-10 text-white p-[40px_16px] bg-transparent min-h-screen w-350 mx-auto">
        <SideBar
          items={sellerSidebarItems}
          activeItemId={activeMenu}
          onItemClick={(item) => setActiveMenu(item.id)}
          className="shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
        />

        <div className="flex-1 flex flex-col gap-12 w-full">
          <section>
            <h2 className="text-[24px] font-semibold text-warm mb-4">배송 등록 대기</h2>
            <div className="flex justify-between pb-3 border-b border-neutral-700 text-sm text-neutral-300 mb-4">
              <span>상품</span>
              <span>낙찰가</span>
            </div>
            <div className="flex flex-col gap-4">
              {pendingItems.length > 0 ? (
                pendingItems.map((item) => (
                  <div
                    key={item.escrowId || item.itemName}
                    onClick={() => handleSelectItem(item.escrowId)}
                    className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-colors ${
                      selectedItemId === String(item.escrowId)
                        ? 'bg-surface border border-neutral-700'
                        : 'bg-transparent border border-transparent hover:bg-surface/60'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-[80px] h-[80px] bg-neutral-800 rounded-xl overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-bold text-neutral-100">{item.itemName}</span>
                        <span className="text-neutral-400 text-[13px]">{formatDateTime(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-neutral-100">{formatPrice(item.amount)}</div>
                  </div>
                ))
              ) : (
                <div className="py-5 text-center text-neutral-500 text-sm">대기 중인 배송이 없습니다</div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-[24px] font-semibold text-warm mb-4">배송 등록 완료</h2>
            <div className="flex justify-between pb-3 border-b border-neutral-700 text-sm text-neutral-300 mb-4">
              <span>상품</span>
              <span>낙찰가</span>
            </div>
            <div className="flex flex-col gap-4">
              {completedItems.length > 0 ? (
                completedItems.map((item) => (
                  <CompletedItemRow
                    key={item.escrowId || item.itemName}
                    item={item}
                    isSelected={selectedItemId === String(item.escrowId)}
                    onSelect={() => handleSelectItem(item.escrowId)}
                    formatPrice={formatPrice}
                  />
                ))
              ) : (
                <div className="py-5 text-center text-neutral-500 text-sm">완료된 배송이 없습니다</div>
              )}
            </div>
          </section>

          {cancelledItems.length > 0 && (
            <section>
              <h2 className="text-[24px] font-semibold text-neutral-500 mb-4">거래 취소</h2>
              <div className="flex justify-between pb-3 border-b border-neutral-700 text-sm text-neutral-300 mb-4">
                <span>상품</span>
                <span>낙찰가</span>
              </div>
              <div className="flex flex-col gap-4">
                {cancelledItems.map((item) => (
                  <div
                    key={item.escrowId || item.itemName}
                    className="flex justify-between items-center p-4 opacity-50 border border-transparent rounded-2xl"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-[80px] h-[80px] bg-neutral-800 rounded-xl overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.itemName} className="w-full h-full object-cover grayscale" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-neutral-500 text-xs font-bold">거래 취소</span>
                        <span className="text-lg font-bold text-neutral-100">{item.itemName}</span>
                        <span className="text-neutral-400 text-[13px]">{formatDateTime(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-neutral-100">{formatPrice(item.amount)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="w-[420px] shrink-0">
          {selectedItemDetail ? (
            <EscrowDetailCard
              detail={selectedItemDetail}
              onClose={() => setSelectedItemId(null)}
              footer={
                isTrackingSubmitted ? (
                  <div className="bg-neutral-800 rounded-xl p-5 border border-neutral-700 text-center text-neutral-500 text-sm">
                    운송장이 등록된 상품입니다
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-8">
                      <div className="relative w-[130px] shrink-0" ref={carrierDropdownRef}>
                        <button
                          type="button"
                          onClick={() => selectedItemId && setShowCarrierModal((prev) => !prev)}
                          disabled={!selectedItemId}
                          className="w-full h-[48px] bg-transparent border border-neutral-700 rounded-lg px-3 text-left cursor-pointer flex items-center justify-between hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span
                            className={`whitespace-nowrap ${carrier ? 'text-neutral-100 text-sm' : 'text-neutral-500 text-sm'}`}
                          >
                            {carrier ? carrierName : '택배사'}
                          </span>
                          <span
                            className={`text-gold transition-transform text-sm ${showCarrierModal ? 'rotate-180' : ''}`}
                          >
                            ▾
                          </span>
                        </button>
                        {showCarrierModal && (
                          <div className="absolute z-10 left-0 right-0 top-[calc(100%+4px)] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-lg max-h-[240px] overflow-y-auto custom-scrollbar min-w-[200px]">
                            {CARRIERS.map((item) => {
                              const isSelected = carrier === item.code;
                              return (
                                <button
                                  key={item.code}
                                  type="button"
                                  onClick={() => {
                                    setCarrier(item.code);
                                    setCarrierName(item.name);
                                    setShowCarrierModal(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-gold/15 text-gold-light font-semibold'
                                      : 'text-neutral-300 hover:bg-warm/8 hover:text-neutral-100'
                                  }`}
                                >
                                  {item.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="송장 번호"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="flex-1 min-w-0 h-[48px] bg-transparent border border-neutral-700 rounded-lg px-4 text-neutral-100 text-sm outline-none"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!carrier || !trackingNumber || !selectedItemId) {
                            showToast({ type: 'warning', message: '택배사와 송장 번호를 모두 입력해주세요.' });
                            return;
                          }

                          try {
                            await validateTrackingInput(carrier, trackingNumber);
                          } catch (error) {
                            showToast({
                              type: 'error',
                              message:
                                error instanceof Error
                                  ? error.message
                                  : '유효하지 않은 운송장번호이거나 택배사 코드입니다.',
                            });
                            return;
                          }

                          submitTracking(
                            { escrowId: selectedItemId, carrierName: carrierName, trackingNumber },
                            {
                              onSuccess: () => {
                                showToast({ type: 'success', message: '운송장 번호가 등록되었습니다.' });
                              },
                              onError: () => {
                                showToast({ type: 'error', message: '운송장 번호 등록에 실패했습니다. 다시 시도해주세요.' });
                              },
                            },
                          );
                        }}
                        className="btn-primary w-[120px] h-12 rounded-lg text-base font-bold cursor-pointer"
                      >
                        등록
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="bg-transparent border-none text-neutral-500 text-[13px] underline cursor-pointer hover:text-neutral-300 transition-colors"
                      >
                        거래취소
                      </button>
                    </div>
                  </>
                )
              }
            />
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-500">
              목록에서 배송 건을 선택해주세요
            </div>
          )}
        </div>
      </div>
    </>
  );
}
