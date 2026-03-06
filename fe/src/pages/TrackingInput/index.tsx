import { useState } from 'react';
import { FaTruck } from 'react-icons/fa';

export type TrackingItem = {
  id: string;
  status: 'pending' | 'completed';
  title: string;
  date: string;
  price: number;
  imageUrl: string;
  buyerName: string;
  buyerId: string;
  shippingInfo: {
    receiverName: string;
    phone: string;
    zipcode: string;
    address: string;
  };
  timeRemaining?: string;
  courier?: string;
  trackingNumber?: string;
};

export default function TrackingInput() {
  const [items] = useState<TrackingItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const pendingItems = items.filter((item) => item.status === 'pending');
  const completedItems = items.filter((item) => item.status === 'completed');

  const selectedItem = items.find((item) => item.id === selectedItemId);

  const formatPrice = (price: number) => price.toLocaleString() + '원';

  return (
    <div style={{ display: 'flex', gap: '40px', color: 'white', padding: '40px 20px', backgroundColor: '#0B0C10', minHeight: '100vh', fontFamily: "'MuseumCulturalFoundationClassic', sans-serif", width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Left Column: Lists */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Pending List */}
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#CEAF82', marginBottom: '16px' }}>배송 등록 대기</h2>
          {/* Table Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #3A3A3C', fontSize: '14px', color: '#E5E5EA', marginBottom: '16px' }}>
            <span>상품</span>
            <span>낙찰가</span>
          </div>
          {/* List Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: selectedItemId === item.id ? '#1C1C1E' : 'transparent',
                    border: selectedItemId === item.id ? '1px solid #3A3A3C' : '1px solid transparent',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.timeRemaining && (
                        <span style={{ color: '#FF453A', fontSize: '13px' }}>배송 등록까지 {item.timeRemaining}</span>
                      )}
                      <span style={{ fontSize: '18px', fontWeight: '700' }}>{item.title}</span>
                      <span style={{ color: '#AEAEB2', fontSize: '13px' }}>{item.date}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatPrice(item.price)}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#8E8E93', fontSize: '14px' }}>
                대기 중인 배송이 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* Completed List */}
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#CEAF82', marginBottom: '16px' }}>배송 등록 완료</h2>
          {/* Table Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #3A3A3C', fontSize: '14px', color: '#E5E5EA', marginBottom: '16px' }}>
            <span>상품</span>
            <span>낙찰가</span>
          </div>
          {/* List Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {completedItems.length > 0 ? (
              completedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: selectedItemId === item.id ? '#1C1C1E' : 'transparent',
                    border: selectedItemId === item.id ? '1px solid #3A3A3C' : '1px solid transparent',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700' }}>{item.title}</span>
                      <span style={{ color: '#AEAEB2', fontSize: '13px' }}>{item.date}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatPrice(item.price)}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#8E8E93', fontSize: '14px' }}>
                완료된 배송이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Detail Panel */}
      <div style={{ width: '420px', flexShrink: 0 }}>
        {selectedItem ? (
          <div style={{ backgroundColor: '#1C1C1E', borderRadius: '24px', padding: '32px', border: '1px solid #3A3A3C', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            {/* Top Product Info */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
              <div style={{ width: '120px', height: '120px', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={selectedItem.imageUrl} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', wordBreak: 'keep-all', lineHeight: '1.3' }}>{selectedItem.title}</p>
                <p style={{ color: '#8E8E93', fontSize: '13px', marginBottom: '16px' }}>{selectedItem.date}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px 12px', fontSize: '14px' }}>
                  <span style={{ color: '#AEAEB2' }}>낙찰가</span>
                  <span style={{ textAlign: 'right', fontWeight: '500' }}>{formatPrice(selectedItem.price)}</span>
                  <span style={{ color: '#AEAEB2' }}>구매자</span>
                  <span style={{ textAlign: 'right' }}>{selectedItem.buyerName}({selectedItem.buyerId})</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: '#3A3A3C', margin: '0 -32px 32px -32px', width: 'calc(100% + 64px)' }} />

            {/* Shipping Info Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CEAF82', fontWeight: 'bold', fontSize: '16px' }}>
                <FaTruck size={18} />
                <span>배송지 정보</span>
              </div>
              {selectedItem.status === 'pending' && selectedItem.timeRemaining && (
                <span style={{ color: '#E5E5EA', fontSize: '13px' }}>배송 등록까지 {selectedItem.timeRemaining}</span>
              )}
            </div>

            {/* Shipping Info Box */}
            <div style={{ backgroundColor: '#151517', borderRadius: '12px', padding: '24px', border: '1px solid #2C2C2E', marginBottom: '32px', fontSize: '14px', color: '#E5E5EA', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>{selectedItem.shippingInfo.receiverName}</p>
              <p>{selectedItem.shippingInfo.phone}</p>
              <p>{selectedItem.shippingInfo.zipcode}</p>
              <p>{selectedItem.shippingInfo.address}</p>
            </div>

            <div style={{ flex: 1 }} /> {/* Push form to bottom */}

            {/* Tracking Form input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              <select
                defaultValue={selectedItem.courier || ''}
                disabled={selectedItem.status === 'completed'}
                style={{
                  width: '120px',
                  height: '48px',
                  backgroundColor: 'transparent',
                  border: '1px solid #3A3A3C',
                  borderRadius: '8px',
                  color: selectedItem.status === 'completed' ? '#8E8E93' : 'white',
                  padding: '0 12px',
                  fontSize: '14px',
                  appearance: 'none',
                  outline: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="" disabled hidden>택배사 선택</option>
                <option value="CJ" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>CJ대한통운</option>
                <option value="POST" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>우체국택배</option>
                <option value="HAN" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>한진택배</option>
                <option value="LOTTE" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>롯데택배</option>
                <option value="LOGEN" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>로젠택배</option>
              </select>
              
              <input
                type="text"
                placeholder="송장 번호"
                defaultValue={selectedItem.trackingNumber || ''}
                disabled={selectedItem.status === 'completed'}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: 'transparent',
                  border: '1px solid #3A3A3C',
                  borderRadius: '8px',
                  color: selectedItem.status === 'completed' ? '#8E8E93' : 'white',
                  padding: '0 16px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <button
                disabled={selectedItem.status === 'completed'}
                style={{
                  width: '120px',
                  height: '48px',
                  backgroundColor: selectedItem.status === 'completed' ? '#2C2C2E' : 'white',
                  color: selectedItem.status === 'completed' ? '#8E8E93' : 'black',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: selectedItem.status === 'completed' ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                등록
              </button>
              {selectedItem.status === 'pending' && (
                <button
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
              )}
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
            목록에서 배송을 선택해주세요
          </div>
        )}
      </div>

    </div>
  );
}
