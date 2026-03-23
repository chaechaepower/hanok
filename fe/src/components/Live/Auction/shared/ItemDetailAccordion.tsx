import { AUCTION_TYPE_LABELS } from '@/constants/auction';
import type { AuctionItem } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

function formatAuctionTime(seconds: number) {
  if (seconds >= 60) {
    return `${seconds / 60}분`;
  }

  return `${seconds}초`;
}

export default function ItemDetailAccordion({ item }: { item: AuctionItem }) {
  const hasUniqueRange = item.minPrice !== null && item.maxPrice !== null && item.maxPrice >= item.minPrice;
  const hasBottomUpPrice = item.startPrice !== null;
  const hasBidUnit = item.bidUnit !== null;
  const hasDetail =
    item.description ||
    item.auctionTime ||
    item.auctionType ||
    hasUniqueRange ||
    hasBottomUpPrice ||
    hasBidUnit ||
    item.images?.length;

  if (!hasDetail) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col gap-2.5 border-t border-white/6 pt-2.5">
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
            <span className="text-caption font-bold text-neutral-600">경매 방식</span>
            <span className="text-label font-extrabold text-gold-dark">{AUCTION_TYPE_LABELS[item.auctionType]}</span>
          </div>
        </div>
      )}

      {item.description && <p className="text-label leading-relaxed text-neutral-500">{item.description}</p>}

      {item.images && item.images.length > 0 && (
        <div className="flex gap-1.5">
          {item.images.map((src, index) => (
            <div
              key={index}
              className="h-16 w-16 shrink-0 rounded-lg bg-neutral-800 bg-cover bg-center"
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
