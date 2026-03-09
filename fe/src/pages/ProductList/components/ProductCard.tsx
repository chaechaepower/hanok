import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const statusConfig = {
    WAITING: { label: '대기', color: '#1C1C1E', textColor: 'white' },
    AUCTION: { label: '경매중', color: '#FF3B30', textColor: 'white' },
    SOLD: { label: '판매완료', color: '#34C759', textColor: 'white' },
  };

  const currentStatus = statusConfig[product.status];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.imageUrls && product.imageUrls.length > 0) {
      setCurrentImageIndex(prev => (prev === 0 ? product.imageUrls.length - 1 : prev - 1));
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.imageUrls && product.imageUrls.length > 0) {
      setCurrentImageIndex(prev => (prev === product.imageUrls.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <div style={{
      display: 'flex',
      backgroundColor: '#1C1C1E',
      borderRadius: '16px',
      padding: '24px',
      gap: '24px',
      marginBottom: '16px',
      border: '1px solid #2C2C2E'
    }}>
      {/* 썸네일 영역 */}
      <div style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        borderRadius: '12px',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
      }}>
        {/* 상태 배지 */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: currentStatus.color,
          color: currentStatus.textColor,
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 10,
        }}>
          {currentStatus.label}
        </div>
        
        {/* 이미지 슬라이더 */}
        {product.imageUrls && product.imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              style={{
                position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              onClick={handleNextImage}
              style={{
                position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <FaChevronRight size={10} />
            </button>
            {/* 인디케이터 */}
            <div style={{
              position: 'absolute', bottom: '8px', left: '0', right: '0',
              display: 'flex', justifyContent: 'center', gap: '4px', zIndex: 10
            }}>
              {product.imageUrls.map((_, idx) => (
                <div key={idx} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: idx === currentImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  transition: 'background-color 0.2s',
                }} />
              ))}
            </div>
          </>
        )}
        <img
          src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[currentImageIndex] : ''}
          alt={product.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* 정보 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 헤더: 태그 및 수정/삭제 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ color: '#8E8E93', fontSize: '13px' }}>
            {product.tags.map(tag => `#${tag}`).join(' ')}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onEdit(product.id)}
              style={{ background: 'none', border: 'none', color: '#C8C8C8', fontSize: '13px', cursor: 'pointer' }}
            >
              수정
            </button>
            <button
              onClick={() => onDelete(product.id)}
              style={{ background: 'none', border: 'none', color: '#C8C8C8', fontSize: '13px', cursor: 'pointer' }}
            >
              삭제
            </button>
          </div>
        </div>

        {/* 제목 및 설명 */}
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>
          {product.title}
        </h3>
        <p style={{ color: '#8E8E93', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.4' }}>
          {product.description}
        </p>

        {/* 상세 메트릭 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          border: '1px solid #3A3A3C',
          borderRadius: '12px',
          backgroundColor: '#2C2C2E',
          marginTop: 'auto',
          overflow: 'hidden',
        }}>
          <MetricBox label="시작가격" value={`${product.startPrice.toLocaleString()} 원`} />
          <MetricBox label="최소 입찰단위" value={`${product.bidUnit.toLocaleString()} 냥`} />
          <MetricBox label="경매 시간" value={`${product.auctionTime} 초`} />
          <MetricBox label="물품 상태" value={product.condition} />
          <MetricBox label="카테고리" value={product.category} />
          <MetricBox label="경매 방식" value={`${product.auctionMethod} ↑`} isLast />
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, isLast = false }: { label: string, value: string, isLast?: boolean }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderRight: isLast ? 'none' : '1px solid #3A3A3C',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <div style={{ color: '#A1A1A6', fontSize: '12px', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>{value}</div>
    </div>
  );
}
