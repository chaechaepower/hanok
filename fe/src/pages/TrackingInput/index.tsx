import { useState } from 'react';
import { FaTruck } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { BsBox } from 'react-icons/bs';
import { useToast } from '@/components/common/Toast';
import SideBar from '@/components/common/layouts/SideBar';
import { sellerSidebarItems } from '@/components/common/layouts/sellerSidebarItems';

import { useGetEscrows } from '@/api/hooks/useGetEscrows';
import { useGetEscrowDetail } from '@/api/hooks/useGetEscrowDetail';
import { usePostTrackingInfo } from '@/api/hooks/usePostTrackingInfo';
import { usePostCancelEscrow } from '@/api/hooks/usePostCancelEscrow';

import { COURIERS } from '@/pages/SellerOnboarding/constants';

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
    <div
      className="fixed inset-0 bg-black/55 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[20px] p-[40px_32px_32px] w-[360px] relative shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col items-center gap-5"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-[#888] p-1"
        >
          <FiX size={20} />
        </button>

        <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center">
          <FiX size={28} color="#EF4444" />
        </div>

        <h2 className="text-xl font-bold text-[#1A2238] m-0">거래를 취소하시겠습니까?</h2>

        <div className="flex items-center gap-2.5 bg-[#F5F5F7] rounded-[10px] p-[12px_16px] w-full">
          <BsBox size={18} color="#555" />
          <span className="text-[15px] text-[#1A2238] font-medium">{itemName}</span>
        </div>

        <div className="w-full flex flex-col gap-2">
          <label className="text-[13px] text-[#888] font-medium">취소 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="취소 사유를 입력해주세요."
            rows={4}
            className="w-full p-3.5 text-sm text-[#1A2238] border border-[#E5E5EA] rounded-[10px] resize-none outline-none font-[inherit] box-border bg-white leading-[1.6]"
          />
        </div>

        <button
          onClick={() => onConfirm(reason)}
          className="w-full h-[52px] bg-[#1A2238] text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-colors hover:bg-[#2C3E62]"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function TrackingInput() {
  const [activeMenu, setActiveMenu] = useState('delivery');
  const { data: escrowsResponse } = useGetEscrows();
  const items = escrowsResponse?.data || [];

  const { mutate: submitTracking } = usePostTrackingInfo();
  const { mutate: cancelEscrow } = usePostCancelEscrow();
  const { showToast } = useToast();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const currentSelectedItem = items.find((i) => String(i.escrowId) === selectedItemId);
  const isTrackingSubmitted =
    currentSelectedItem &&
    (currentSelectedItem.escrowState === 'INVOICE_SUBMITTED' || currentSelectedItem.escrowState === 'COMPLETED');

  const { data: detailResponse } = useGetEscrowDetail(selectedItemId);
  const selectedItemDetail = detailResponse?.data;

  const [courier, setCourier] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showCourierModal, setShowCourierModal] = useState(false);

  const pendingItems = items.filter((item) => item.escrowState === 'DEPOSITED');
  const completedItems = items.filter(
    (item) => item.escrowState === 'INVOICE_SUBMITTED' || item.escrowState === 'COMPLETED',
  );
  const cancelledItems = items.filter((item) => item.escrowState === 'CANCELLED');

  const handleSelectItem = (id: string | number | undefined) => {
    if (!id) return;
    const stringId = id.toString();
    setSelectedItemId(stringId);
    setCourier('');
    setTrackingNumber('');
  };

  const handleCancelConfirm = (cancelReason: string) => {
    console.log('Cancel reason:', cancelReason);
    if (!selectedItemId) return;
    cancelEscrow({ escrowId: selectedItemId, cancelReason }, {
      onSuccess: () => {
        setShowCancelModal(false);
        showToast({ message: '거래가 취소되었습니다.' });
        setSelectedItemId(null);
      },
      onError: () => {
        setShowCancelModal(false);
        showToast({ message: '거래 취소에 실패했습니다. 다시 시도해주세요.' });
      },
    });
  };

  const formatPrice = (price: number) => price.toLocaleString() + '원';
  const formatDate = (dateStr: string) => dateStr.replace(/T/, ' ').replace(/:\d{2}(\.\d+)?Z?$/, '').replace(/Z$/, '');

  return (
    <>
      {showCancelModal && selectedItemDetail && (
        <CancelModal
          itemName={selectedItemDetail.winningInfo.itemName}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      <div className="flex gap-10 text-white p-[40px_16px] bg-transparent min-h-screen w-full max-w-[1200px] mx-auto">
        <SideBar
          items={sellerSidebarItems}
          activeItemId={activeMenu}
          onItemClick={(item) => setActiveMenu(item.id)}
          className="!w-[200px] shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
        />
        <div className="flex-1 flex flex-col gap-12">
          <section>
            <h2 className="text-xl font-bold text-[#CEAF82] mb-4">
              배송 등록 대기
            </h2>
            <div className="flex justify-between pb-3 border-b border-[#3A3A3C] text-sm text-[#E5E5EA] mb-4">
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
                        ? 'bg-[#1C1C1E] border border-[#3A3A3C]'
                        : 'bg-transparent border border-transparent hover:bg-[#1C1C1E]/60'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-[80px] h-[80px] bg-[#2C2C2E] rounded-xl overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-xs">
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-bold">{item.itemName}</span>
                        <span className="text-[#AEAEB2] text-[13px]">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold">{formatPrice(item.amount)}</div>
                  </div>
                ))
              ) : (
                <div className="py-5 text-center text-[#8E8E93] text-sm">
                  대기 중인 배송이 없습니다.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#CEAF82] mb-4">
              배송 등록 완료
            </h2>
            <div className="flex justify-between pb-3 border-b border-[#3A3A3C] text-sm text-[#E5E5EA] mb-4">
              <span>상품</span>
              <span>낙찰가</span>
            </div>
            <div className="flex flex-col gap-4">
              {completedItems.length > 0 ? (
                completedItems.map((item) => (
                  <div
                    key={item.escrowId || item.itemName}
                    onClick={() => handleSelectItem(item.escrowId)}
                    className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-colors ${
                      selectedItemId === String(item.escrowId)
                        ? 'bg-[#1C1C1E] border border-[#3A3A3C]'
                        : 'bg-transparent border border-transparent hover:bg-[#1C1C1E]/60'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-[80px] h-[80px] bg-[#2C2C2E] rounded-xl overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-xs">
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[#CEAF82] text-xs font-bold">
                          {item.escrowState === 'INVOICE_SUBMITTED'
                            ? '배송중'
                            : item.escrowState === 'COMPLETED'
                              ? '배송 완료'
                              : item.escrowState}
                        </span>
                        <span className="text-lg font-bold">{item.itemName}</span>
                        <span className="text-[#AEAEB2] text-[13px]">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold">{formatPrice(item.amount)}</div>
                  </div>
                ))
              ) : (
                <div className="py-5 text-center text-[#8E8E93] text-sm">
                  완료된 배송이 없습니다.
                </div>
              )}
            </div>
          </section>

          {cancelledItems.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#8E8E93] mb-4">
                거래 취소
              </h2>
              <div className="flex justify-between pb-3 border-b border-[#3A3A3C] text-sm text-[#E5E5EA] mb-4">
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
                      <div className="w-[80px] h-[80px] bg-[#2C2C2E] rounded-xl overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            className="w-full h-full object-cover grayscale"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-xs">
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[#8E8E93] text-xs font-bold">거래 취소</span>
                        <span className="text-lg font-bold">{item.itemName}</span>
                        <span className="text-[#AEAEB2] text-[13px]">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold">{formatPrice(item.amount)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="w-[420px] shrink-0">
          {selectedItemDetail ? (
            <div className="bg-[#1C1C1E] rounded-3xl p-8 border border-[#3A3A3C] flex flex-col min-h-[600px]">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="bg-transparent border-none text-[#8E8E93] cursor-pointer hover:text-white transition-colors p-0"
                >
                  <FiX size={22} />
                </button>
              </div>
              <div className="flex gap-5 mb-8">
                <div className="w-[120px] h-[120px] bg-[#2C2C2E] rounded-2xl overflow-hidden shrink-0">
                  {selectedItemDetail.winningInfo.imageUrl ? (
                    <img
                      src={selectedItemDetail.winningInfo.imageUrl}
                      alt={selectedItemDetail.winningInfo.itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-sm">
                      이미지 준비중
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-xl font-bold mb-2 break-keep leading-[1.3]">
                    {selectedItemDetail.winningInfo.itemName}
                  </p>
                  <p className="text-[#8E8E93] text-[13px] mb-4">
                    {formatDate(selectedItemDetail.winningInfo.wonAt)}
                  </p>
                  <div className="grid grid-cols-[60px_1fr] gap-[8px_12px] text-sm">
                    <span className="text-[#AEAEB2]">낙찰가</span>
                    <span className="text-right font-medium">
                      {formatPrice(selectedItemDetail.winningInfo.finalPrice)}
                    </span>
                    <span className="text-[#AEAEB2]">구매자</span>
                    <span className="text-right">
                      {selectedItemDetail.winningInfo.sellerName}({selectedItemDetail.winningInfo.sellerId})
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#3A3A3C] -mx-8 mb-8 w-[calc(100%+64px)]" />

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-[#CEAF82] font-bold text-base">
                  <FaTruck size={18} />
                  <span>배송지 정보</span>
                </div>
              </div>

              <div className="bg-[#151517] rounded-xl p-6 border border-[#2C2C2E] mb-4 text-sm text-[#E5E5EA] flex flex-col gap-2">
                <p>{selectedItemDetail.shippingAddress.name}</p>
                <p>{selectedItemDetail.shippingAddress.phone}</p>
                <p>
                  [{selectedItemDetail.shippingAddress.postalCode}] {selectedItemDetail.shippingAddress.address}{' '}
                  {selectedItemDetail.shippingAddress.addressDetail}
                </p>
              </div>

              {selectedItemDetail.delivery && (
                <div className="bg-[#151517] rounded-xl p-[16px_24px] border border-[#2C2C2E] mb-4 text-sm text-[#E5E5EA] flex justify-between items-center">
                  <span className="text-[#AEAEB2]">택배 정보</span>
                  <span className="font-semibold">
                    {selectedItemDetail.delivery.courierName} | {selectedItemDetail.delivery.trackingNumber}
                  </span>
                </div>
              )}

              <div className="flex-1" />

              {isTrackingSubmitted ? (
                <div className="bg-[#2C2C2E] rounded-xl p-5 border border-[#3A3A3C] text-center text-[#8E8E93] text-sm">
                  운송장이 등록된 상품입니다.
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-8">
                    <button
                      type="button"
                      onClick={() => selectedItemId && setShowCourierModal(true)}
                      disabled={!selectedItemId}
                      className="w-[160px] h-[48px] bg-transparent border border-[#3A3A3C] rounded-lg px-3 text-left cursor-pointer flex items-center justify-between hover:border-[#d9b36d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className={courier ? 'text-white text-sm' : 'text-[#8E8E93] text-sm'}>
                        {courier ? courierName : '택배사 선택'}
                      </span>
                      <span className="text-[#555] text-xs">▼</span>
                    </button>
                    <input
                      type="text"
                      placeholder="송장 번호"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="flex-1 h-[48px] bg-transparent border border-[#3A3A3C] rounded-lg px-4 text-white text-sm outline-none"
                    />
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => {
                        if (!courier || !trackingNumber || !selectedItemId) {
                          showToast({ message: '택배사와 송장 번호를 모두 입력해주세요.' });
                          return;
                        }
                        submitTracking(
                          { escrowId: selectedItemId, carrierName: courier, trackingNumber },
                          {
                            onSuccess: () => {
                              showToast({ message: '운송장 번호가 등록되었습니다.' });
                            },
                            onError: () => {
                              showToast({ message: '운송장 번호 등록에 실패했습니다. 다시 시도해주세요.' });
                            },
                          },
                        );
                      }}
                      className="w-[120px] h-12 bg-white text-black rounded-lg border-none text-base font-bold cursor-pointer transition-colors hover:bg-gray-200"
                    >
                      등록
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="bg-transparent border-none text-[#8E8E93] text-[13px] underline cursor-pointer"
                    >
                      거래취소
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#8E8E93]">
              목록에서 배송을 선택해주세요
            </div>
          )}
        </div>
      </div>

      {showCourierModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60"
          onClick={() => setShowCourierModal(false)}
        >
          <div
            className="w-full max-w-[430px] max-h-[70vh] bg-[#1C1C1E] rounded-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[17px] font-bold text-white">택배사 선택</h3>
                <button
                  type="button"
                  onClick={() => setShowCourierModal(false)}
                  className="bg-transparent border-none text-[#8E8E93] text-2xl cursor-pointer p-0"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-5 pt-2 pb-5">
              <div className="grid grid-cols-3 gap-2">
                {COURIERS.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCourier(c.code);
                      setCourierName(c.name);
                      setShowCourierModal(false);
                    }}
                    className={`py-3 px-1 border-none rounded-lg text-[13px] cursor-pointer text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                      courier === c.code
                        ? 'bg-[#CEAF82] text-[#0B0C10] font-bold'
                        : 'bg-[#2C2C2E] text-[#E5E5EA] font-normal'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
