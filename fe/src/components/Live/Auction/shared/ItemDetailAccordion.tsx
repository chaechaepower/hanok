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
  const hasDetail =
    item.description || item.bidUnit || item.auctionTime || item.auctionType || (item.images && item.images.length > 0);

  if (!hasDetail) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col gap-2.5 border-t border-white/6 pt-2.5">
      {(item.bidUnit || item.auctionTime || item.auctionType) && (
        <div className="flex flex-wrap gap-3">
          {item.auctionTime && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-neutral-600">경매 시간</span>
              <span className="text-[11px] font-extrabold text-gold-dark">{formatAuctionTime(item.auctionTime)}</span>
            </div>
          )}
          {item.bidUnit && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-neutral-600">입찰 단위</span>
              <span className="text-[11px] font-extrabold text-gold-dark">{formatPrice(item.bidUnit)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-neutral-600">경매 방식</span>
            <span className="text-[11px] font-extrabold text-gold-dark">{AUCTION_TYPE_LABELS[item.auctionType]}</span>
          </div>
        </div>
      )}

      {item.description && <p className="text-[11px] leading-relaxed text-neutral-500">{item.description}</p>}

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
