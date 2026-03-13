import { useState } from 'react';
import { FaTruck } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { BsBox } from 'react-icons/bs';
import SideBar from '@/components/common/layouts/SideBar';
import { sellerSidebarItems } from '@/components/common/layouts/sellerSidebarItems';

import { useGetEscrows } from '@/api/hooks/useGetEscrows';
import { useGetEscrowDetail } from '@/api/hooks/useGetEscrowDetail';
import { usePostTrackingInfo } from '@/api/hooks/usePostTrackingInfo';
import { usePostCancelEscrow } from '@/api/hooks/usePostCancelEscrow';

// 자주 쓰는 국내 택배사 목록 (정적 데이터)
const COURIER_LIST = [
  { Code: '04', Name: 'CJ대한통운' },
  { Code: '01', Name: '우체국택배' },
  { Code: '05', Name: '한진택배' },
  { Code: '08', Name: '롯데택배' },
  { Code: '06', Name: '로젠택배' },
  { Code: '22', Name: '대신택배' },
  { Code: '23', Name: '경동택배' },
  { Code: '32', Name: '합동택배' },
  { Code: '46', Name: 'CU 편의점택배' },
  { Code: '24', Name: 'GS Postbox 택배' },
];

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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          padding: '40px 32px 32px',
          width: '360px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#888',
            padding: '4px',
          }}
        >
          <FiX size={20} />
        </button>

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiX size={28} color="#EF4444" />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A2238', margin: 0 }}>거래를 취소하시겠습니까?</h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#F5F5F7',
            borderRadius: '10px',
            padding: '12px 16px',
            width: '100%',
          }}
        >
          <BsBox size={18} color="#555" />
          <span style={{ fontSize: '15px', color: '#1A2238', fontWeight: '500' }}>{itemName}</span>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>취소 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="취소 사유를 입력해주세요."
            rows={4}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '14px',
              color: '#1A2238',
              border: '1px solid #E5E5EA',
              borderRadius: '10px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              lineHeight: '1.6',
            }}
          />
        </div>

        <button
          onClick={() => onConfirm(reason)}
          style={{
            width: '100%',
            height: '52px',
            backgroundColor: '#1A2238',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2C3E62')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1A2238')}
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

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const currentSelectedItem = items.find((i) => String(i.escrowId) === selectedItemId);
  const isTrackingSubmitted =
    currentSelectedItem &&
    (currentSelectedItem.escrowState === 'INVOICE_SUBMITTED' || currentSelectedItem.escrowState === 'COMPLETED');

  const { data: detailResponse } = useGetEscrowDetail(selectedItemId);
  const selectedItemDetail = detailResponse?.data;

  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

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
    cancelEscrow(selectedItemId, {
      onSuccess: () => {
        setShowCancelModal(false);
        alert('거래가 취소되었습니다.');
        setSelectedItemId(null);
      },
      onError: () => {
        setShowCancelModal(false);
        alert('거래 취소에 실패했습니다. 다시 시도해주세요.');
      },
    });
  };

  const formatPrice = (price: number) => price.toLocaleString() + '원';

  return (
    <>
      {showCancelModal && selectedItemDetail && (
        <CancelModal
          itemName={selectedItemDetail.winningInfo.itemName}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      <div
        style={{
          display: 'flex',
          gap: '40px',
          color: 'white',
          padding: '40px 16px',
          backgroundColor: '#0B0C10',
          minHeight: '100vh',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <SideBar
          items={sellerSidebarItems}
          activeItemId={activeMenu}
          onItemClick={(item) => setActiveMenu(item.id)}
          className="!w-[200px] shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#CEAF82', marginBottom: '16px' }}>
              배송 등록 대기
            </h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid #3A3A3C',
                fontSize: '14px',
                color: '#E5E5EA',
                marginBottom: '16px',
              }}
            >
              <span>상품</span>
              <span>낙찰가</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingItems.length > 0 ? (
                pendingItems.map((item) => (
                  <div
                    key={item.escrowId || item.itemName}
                    onClick={() => handleSelectItem(item.escrowId)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: selectedItemId === String(item.escrowId) ? '#1C1C1E' : 'transparent',
                      border: selectedItemId === String(item.escrowId) ? '1px solid #3A3A3C' : '1px solid transparent',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          backgroundColor: '#2C2C2E',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#8E8E93',
                              fontSize: '12px',
                            }}
                          >
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700' }}>{item.itemName}</span>
                        <span style={{ color: '#AEAEB2', fontSize: '13px' }}>{item.createdAt}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatPrice(item.amount)}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#8E8E93', fontSize: '14px' }}>
                  대기 중인 배송이 없습니다.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#CEAF82', marginBottom: '16px' }}>
              배송 등록 완료
            </h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid #3A3A3C',
                fontSize: '14px',
                color: '#E5E5EA',
                marginBottom: '16px',
              }}
            >
              <span>상품</span>
              <span>낙찰가</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completedItems.length > 0 ? (
                completedItems.map((item) => (
                  <div
                    key={item.escrowId || item.itemName}
                    onClick={() => handleSelectItem(item.escrowId)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: selectedItemId === String(item.escrowId) ? '#1C1C1E' : 'transparent',
                      border: selectedItemId === String(item.escrowId) ? '1px solid #3A3A3C' : '1px solid transparent',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          backgroundColor: '#2C2C2E',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#8E8E93',
                              fontSize: '12px',
                            }}
                          >
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#CEAF82', fontSize: '12px', fontWeight: 'bold' }}>
                          {item.escrowState === 'INVOICE_SUBMITTED'
                            ? '배송중'
                            : item.escrowState === 'COMPLETED'
                              ? '배송 완료'
                              : item.escrowState}
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: '700' }}>{item.itemName}</span>
                        <span style={{ color: '#AEAEB2', fontSize: '13px' }}>{item.createdAt}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatPrice(item.amount)}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#8E8E93', fontSize: '14px' }}>
                  완료된 배송이 없습니다.
                </div>
              )}
            </div>
          </section>

          {cancelledItems.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#8E8E93', marginBottom: '16px' }}>
                거래 취소
              </h2>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #3A3A3C',
                  fontSize: '14px',
                  color: '#E5E5EA',
                  marginBottom: '16px',
                }}
              >
                <span>상품</span>
                <span>낙찰가</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cancelledItems.map((item) => (
                  <div
                    key={item.escrowId || item.itemName}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      opacity: 0.5,
                      border: '1px solid transparent',
                      borderRadius: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          backgroundColor: '#2C2C2E',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#8E8E93',
                              fontSize: '12px',
                            }}
                          >
                            이미지 준비중
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#8E8E93', fontSize: '12px', fontWeight: 'bold' }}>거래 취소</span>
                        <span style={{ fontSize: '18px', fontWeight: '700' }}>{item.itemName}</span>
                        <span style={{ color: '#AEAEB2', fontSize: '13px' }}>{item.createdAt}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatPrice(item.amount)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div style={{ width: '420px', flexShrink: 0 }}>
          {selectedItemDetail ? (
            <div
              style={{
                backgroundColor: '#1C1C1E',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid #3A3A3C',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '600px',
              }}
            >
              <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    backgroundColor: '#2C2C2E',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {selectedItemDetail.winningInfo.imageUrl ? (
                    <img
                      src={selectedItemDetail.winningInfo.imageUrl}
                      alt={selectedItemDetail.winningInfo.itemName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8E8E93',
                        fontSize: '14px',
                      }}
                    >
                      이미지 준비중
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                  <p
                    style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      wordBreak: 'keep-all',
                      lineHeight: '1.3',
                    }}
                  >
                    {selectedItemDetail.winningInfo.itemName}
                  </p>
                  <p style={{ color: '#8E8E93', fontSize: '13px', marginBottom: '16px' }}>
                    {selectedItemDetail.winningInfo.wonAt}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px 12px', fontSize: '14px' }}>
                    <span style={{ color: '#AEAEB2' }}>낙찰가</span>
                    <span style={{ textAlign: 'right', fontWeight: '500' }}>
                      {formatPrice(selectedItemDetail.winningInfo.finalPrice)}
                    </span>
                    <span style={{ color: '#AEAEB2' }}>구매자</span>
                    <span style={{ textAlign: 'right' }}>
                      {selectedItemDetail.winningInfo.sellerName}({selectedItemDetail.winningInfo.sellerId})
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: '1px',
                  backgroundColor: '#3A3A3C',
                  margin: '0 -32px 32px -32px',
                  width: 'calc(100% + 64px)',
                }}
              />

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#CEAF82',
                    fontWeight: 'bold',
                    fontSize: '16px',
                  }}
                >
                  <FaTruck size={18} />
                  <span>배송지 정보</span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#151517',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #2C2C2E',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#E5E5EA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <p>{selectedItemDetail.shippingAddress.name}</p>
                <p>{selectedItemDetail.shippingAddress.phone}</p>
                <p>
                  [{selectedItemDetail.shippingAddress.postalCode}] {selectedItemDetail.shippingAddress.address}{' '}
                  {selectedItemDetail.shippingAddress.addressDetail}
                </p>
              </div>

              {selectedItemDetail.delivery && (
                <div
                  style={{
                    backgroundColor: '#151517',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    border: '1px solid #2C2C2E',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#E5E5EA',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#AEAEB2' }}>택배 정보</span>
                  <span style={{ fontWeight: '600' }}>
                    {selectedItemDetail.delivery.courierName} | {selectedItemDetail.delivery.trackingNumber}
                  </span>
                </div>
              )}

              <div style={{ flex: 1 }} />

              {isTrackingSubmitted ? (
                <div
                  style={{
                    backgroundColor: '#2C2C2E',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #3A3A3C',
                    textAlign: 'center',
                    color: '#8E8E93',
                    fontSize: '14px',
                  }}
                >
                  운송장이 등록된 상품입니다.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                    <select
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      disabled={!selectedItemId}
                      style={{
                        width: '140px',
                        height: '48px',
                        backgroundColor: 'transparent',
                        border: '1px solid #3A3A3C',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '0 12px',
                        fontSize: '14px',
                        appearance: 'none',
                        outline: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
                    >
                      <option value="" disabled hidden>
                        택배사 선택
                      </option>
                      {COURIER_LIST.map((company) => (
                        <option
                          key={company.Code}
                          value={company.Code}
                          style={{ backgroundColor: '#1C1C1E', color: 'white' }}
                        >
                          {company.Name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="송장 번호"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      style={{
                        flex: 1,
                        height: '48px',
                        backgroundColor: 'transparent',
                        border: '1px solid #3A3A3C',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '0 16px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <button
                      onClick={() => {
                        if (!courier || !trackingNumber || !selectedItemId) {
                          alert('택배사와 송장 번호를 모두 입력해주세요.');
                          return;
                        }
                        submitTracking(
                          { escrowId: selectedItemId, carrierName: courier, trackingNumber },
                          {
                            onSuccess: () => {
                              alert('운송장 번호가 성공적으로 등록되었습니다.');
                            },
                            onError: () => {
                              alert('운송장 번호 등록에 실패했습니다. 다시 시도해주세요.');
                            },
                          },
                        );
                      }}
                      style={{
                        width: '120px',
                        height: '48px',
                        backgroundColor: 'white',
                        color: 'black',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      등록
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#8E8E93',
                        fontSize: '13px',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      거래취소
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8E8E93',
              }}
            >
              목록에서 배송을 선택해주세요
            </div>
          )}
        </div>
      </div>
    </>
  );
}
