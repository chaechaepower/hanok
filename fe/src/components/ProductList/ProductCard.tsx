import { useState } from 'react';
import { FaImage, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Product } from '@/types';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';

const conditionLabels: Record<string, string> = {
  BRAND_NEW: '미개봉',
  OPEN_BOX: '개봉된 새상품',
  REFURBISHED: '리퍼비시',
  USED: '중고',
};

const statusClassMap: Record<string, { label: string; bg: string }> = {
  READY: { label: '대기', bg: 'bg-neutral-800' },
  PENDING: { label: '경매중', bg: 'bg-accent' },
  SOLD: { label: '판매완료', bg: 'bg-ember' },
};

interface ProductCardProps {
  product: Product;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const currentStatus = statusClassMap[product.status] || { label: product.status, bg: 'bg-neutral-600' };

  const images = product.images.filter((img) => !!img);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="flex bg-surface rounded-2xl p-6 gap-6 mb-4 border border-neutral-800 hover:bg-surface-elevated transition-colors">
      <div className="relative w-[160px] h-[160px] rounded-xl overflow-hidden shrink-0 bg-white group">
        <div className={`absolute top-3 left-3 ${currentStatus.bg} text-white px-3 py-1 rounded-full text-xs font-semibold z-10`}>
          {currentStatus.label}
        </div>

        {images.length > 0 ? (
          <>
            <img
              src={images[currentIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none z-10"
                >
                  <FaChevronLeft size={12} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none z-10"
                >
                  <FaChevronRight size={12} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-500 text-[13px]">
            <FaImage size={28} className="opacity-50 mb-2" />
            이미지 없음
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between mb-2">
          <div className="text-neutral-500 text-[13px]">{product.tags.map((tag) => `#${tag}`).join(' ')}</div>
          {product.status === 'READY' && (
            <div className="flex gap-3">
              <button
                onClick={() => onEdit(product.itemId)}
                className="bg-transparent border-none text-neutral-300 text-[13px] cursor-pointer hover:text-neutral-100 transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => onDelete(product.itemId)}
                className="bg-transparent border-none text-neutral-300 text-[13px] cursor-pointer hover:text-accent-light transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        <h3 className="text-neutral-100 text-lg font-bold m-0 mb-1.5">{product.name}</h3>
        <p className="text-neutral-500 text-sm m-0 mb-6 leading-relaxed">{product.description}</p>

        <div className="grid grid-cols-6 border border-neutral-700 rounded-xl bg-neutral-800 mt-auto overflow-hidden">
          <MetricBox label="시작가격" value={`${product.startPrice.toLocaleString()} 원`} />
          <MetricBox label="최소 입찰단위" value={`${product.bidUnit.toLocaleString()} 원`} />
          <MetricBox label="경매 시간" value={`${product.auctionDuration} 초`} />
          <MetricBox label="물품 상태" value={conditionLabels[product.itemCondition] || product.itemCondition} />
          <MetricBox
            label="카테고리"
            value={MAIN_CATEGORY_ITEMS.find((c) => c.id === product.category)?.label || product.category}
          />
          <MetricBox label="경매 방식" value={product.auctionType === 'UNIQUE_TOP' ? '유일최고가' : '상향식'} isLast />
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div className={`px-4 py-3 flex flex-col justify-center ${isLast ? '' : 'border-r border-neutral-700'}`}>
      <div className="text-neutral-400 text-xs mb-1">{label}</div>
      <div className="text-neutral-100 text-[15px] font-semibold">{value}</div>
    </div>
  );
}
