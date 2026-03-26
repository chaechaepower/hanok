import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';

import { MAIN_CATEGORY_ITEMS } from '@/components/Main/mainCategoryItems';
import EditDeleteActions from '@/components/common/EditDeleteActions';
import { getItemConditionLabel } from '@/constants/itemCondition';
import type { Product } from '@/types';

const formatCreatedAt = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const statusClassMap: Record<string, { label: string; bg: string }> = {
  READY: { label: '대기', bg: 'bg-neutral-800' },
  SCHEDULED: { label: '대기', bg: 'bg-neutral-800' },
  PENDING: { label: '거래중', bg: 'bg-accent' },
  SOLD: { label: '판매완료', bg: 'bg-ember' },
};

interface ProductCardProps {
  product: Product;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const currentStatus = statusClassMap[product.status] || { label: product.status, bg: 'bg-neutral-600' };
  const images = product.images.filter(Boolean);
  const tagText = product.tags.map((tag) => `#${tag}`).join(' ');
  const showActionButtons = product.status === 'READY' || product.status === 'SCHEDULED';

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="mb-4 flex items-center justify-center gap-6 rounded-2xl border border-neutral-800 bg-surface-elevated p-6 transition-colors hover:bg-surface">
      <div className="group relative h-[160px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-white">
        <div
          className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold text-white ${currentStatus.bg}`}
        >
          {currentStatus.label}
        </div>

        {images.length > 0 ? (
          <>
            <img src={images[currentIndex]} alt={product.name} className="h-full w-full object-cover" />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <FaChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <FaChevronRight size={12} />
                </button>
                <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-800 text-[13px] text-neutral-500">
            <FaImage size={28} className="mb-2 opacity-50" />
            이미지 없음
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {tagText ? <div className="mb-2 text-[13px] text-neutral-500">{tagText}</div> : null}

        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="m-0 min-w-0 truncate text-lg font-bold text-neutral-100">{product.name}</h3>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {showActionButtons && (
              <EditDeleteActions
                onEdit={() => onEdit(product.itemId)}
                onDelete={() => onDelete(product.itemId)}
                containerClassName="flex gap-3"
                editClassName="cursor-pointer border-none bg-transparent text-[13px] text-neutral-300 transition-colors hover:text-neutral-100"
                deleteClassName="cursor-pointer border-none bg-transparent text-[13px] text-neutral-300 transition-colors hover:text-accent-light"
              />
            )}
          </div>
        </div>

        <p className="m-0 mb-4 text-sm leading-relaxed text-neutral-500">{product.description}</p>

        <div className="mt-auto grid grid-cols-3 rounded-xl border border-neutral-700 bg-neutral-800">
          <MetricBox label="물품 상태" value={getItemConditionLabel(product.itemCondition)} />
          <MetricBox
            label="카테고리"
            value={MAIN_CATEGORY_ITEMS.find((category) => category.id === product.category)?.label || product.category}
          />
          <MetricBox label="등록일" value={formatCreatedAt(product.createdAt)} isLast />
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div className={`relative flex flex-col justify-center px-4 py-3 ${isLast ? '' : 'border-r border-neutral-700'}`}>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-neutral-400">
        <span>{label}</span>
      </div>
      <div className="break-all text-[15px] font-semibold text-neutral-100">{value}</div>
    </div>
  );
}
