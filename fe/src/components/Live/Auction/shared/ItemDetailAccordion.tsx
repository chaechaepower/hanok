import { useEffect, useState } from 'react';
import type { AuctionItem } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import { FiX } from 'react-icons/fi';
import { ITEM_CONDITION_LABELS } from '@/constants/itemCondition';

function formatAuctionTime(seconds: number) {
  if (seconds >= 60) {
    return `${seconds / 60}분`;
  }

  return `${seconds}초`;
}

export default function ItemDetailAccordion({ item }: { item: AuctionItem }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const hasUniqueRange = item.minPrice !== null && item.maxPrice !== null && item.maxPrice >= item.minPrice;
  const hasBottomUpPrice = item.startPrice !== null;
  const conditionBadge = ITEM_CONDITION_LABELS[item.condition];

  const hasBidUnit = item.bidUnit !== null;
  const hasDetail =
    item.description ||
    item.auctionTime ||
    item.auctionType ||
    hasUniqueRange ||
    hasBottomUpPrice ||
    hasBidUnit ||
    item.images?.length;

  useEffect(() => {
    if (selectedImageIndex === null) {
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectedImageIndex]);

  const selectedImageSrc =
    selectedImageIndex !== null && item.images?.[selectedImageIndex] ? item.images[selectedImageIndex] : null;
  const selectedImageNumber = selectedImageIndex !== null ? selectedImageIndex + 1 : null;

  if (!hasDetail) {
    return null;
  }

  return (
    <>
      <div
        className="mt-2 flex flex-col gap-2.5 border-t border-white/6 pt-2.5"
        onClick={(event) => event.stopPropagation()}
      >
        {(item.auctionTime || item.auctionType || hasUniqueRange || hasBottomUpPrice || hasBidUnit) && (
          <div className="flex flex-wrap gap-3">
            {item.auctionTime && (
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-bold text-neutral-600">경매 시간</span>
                <span className="text-label font-extrabold text-gold-dark">{formatAuctionTime(item.auctionTime)}</span>
              </div>
            )}
            {item.auctionType === 'BOTTOM_UP' && hasBottomUpPrice && (
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-bold text-neutral-600">시작가</span>
                <span className="text-label font-extrabold text-gold-dark">{formatPrice(item.startPrice ?? 0)}</span>
              </div>
            )}
            {item.auctionType === 'BOTTOM_UP' && hasBidUnit && (
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-bold text-neutral-600">입찰 단위</span>
                <span className="text-label font-extrabold text-gold-dark">{formatPrice(item.bidUnit ?? 0)}</span>
              </div>
            )}
            {item.auctionType === 'UNIQUE_TOP' && hasUniqueRange && (
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-bold text-neutral-600">가격 범위</span>
                <span className="text-label font-extrabold text-gold-dark">
                  {formatPrice(item.minPrice ?? 0)} ~ {formatPrice(item.maxPrice ?? 0)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-bold text-neutral-600">물품 상태</span>
                <span className={`text-label font-extrabold text-gold-dark`}>{conditionBadge}</span>
              </div>
            </div>
          </div>
        )}

        {item.description && <p className="text-label leading-relaxed text-neutral-500">{item.description}</p>}

        {item.images && item.images.length > 0 && (
          <div className="flex gap-1.5">
            {item.images.map((src, index) => (
              <button
                key={index}
                type="button"
                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-800 bg-cover bg-center transition-transform hover:scale-[1.03]"
                style={{ backgroundImage: `url(${src})` }}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedImageIndex(index);
                }}
                aria-label={`${item.name} 이미지 ${index + 1} 확대 보기`}
              >
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/18" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedImageSrc && (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-black/78 px-4 py-8 backdrop-blur-sm"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedImageIndex(null);
          }}
        >
          <div
            className="relative flex max-h-full w-full max-w-4xl flex-col items-end gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="flex h-11 items-center justify-center bg-black/36 px-4 text-label font-bold text-white transition hover:bg-black/54"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedImageIndex(null);
              }}
            >
              <FiX size={20} />
            </button>

            <div className="w-full overflow-hidden rounded-(--radius-panel) border border-white/10 bg-black/30 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <img
                src={selectedImageSrc}
                alt={`${item.name} 확대 이미지 ${selectedImageNumber}`}
                className="max-h-[78vh] w-full object-contain bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
