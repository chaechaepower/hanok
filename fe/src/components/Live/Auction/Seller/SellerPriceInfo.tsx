import type { AuctionStatisticsPayload } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

interface Props {
  auctionStatistics: AuctionStatisticsPayload | null;
}

export default function PriceInfo({ auctionStatistics }: Props) {
  return (
    <div className="border-t border-white/6 pt-4">
      <div className="flex items-center justify-between">
        <div className="text-label text-neutral-600">시작가격</div>
        <div className="text-sm font-bold text-white">
          <span className="font-mono font-black">{formatPrice(auctionStatistics?.startPrice ?? 0, { suffix: false })}</span>
          원
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-label text-neutral-600">현재 최고가</div>
        <div className="text-xl font-black text-gold">
          <span className="font-mono font-black">{formatPrice(auctionStatistics?.currentPrice ?? 0, { suffix: false })}</span>
          원
        </div>
      </div>
    </div>
  );
}
