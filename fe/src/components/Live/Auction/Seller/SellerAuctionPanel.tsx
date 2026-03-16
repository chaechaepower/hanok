import SellerStats from './SellerStats';
import SellerPriceInfo from './SellerPriceInfo';
import BidFeed from './BidFeed';
import type { AuctionStatisticsPayload } from '@/types';

interface Props {
  auctionStatistics: AuctionStatisticsPayload | null;
}

export default function SellerAuctionPanel({ auctionStatistics }: Props) {
  const effectiveCurrentPrice = auctionStatistics
    ? Math.max(auctionStatistics.currentPrice, auctionStatistics.startPrice)
    : 0;
  const riseRate =
    auctionStatistics && auctionStatistics.startPrice > 0
      ? ((effectiveCurrentPrice - auctionStatistics.startPrice) / auctionStatistics.startPrice) * 100
      : 0;

  return (
    <div className="bid-feed-scroll flex h-full flex-col gap-4 overflow-y-auto p-4">
      <SellerStats auctionStatistics={auctionStatistics} riseRate={riseRate} />

      {/* 현재 물품 구분선 */}
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#52525b]">현재 물품</div>
        <div className="h-px flex-1 bg-linear-to-r from-[rgba(255,255,255,.07)] to-transparent" />
      </div>

      {/* 물품명 칩 */}
      <div className="-mt-2 flex items-center gap-2">
        <span className="rounded-full bg-[rgba(197,160,89,.15)] px-2.5 py-0.5 text-[10px] font-bold text-[#C5A059]">
          경매중
        </span>
        <span className="text-xs font-bold text-white">{auctionStatistics?.itemName ?? '데이터 수신 대기중'}</span>
      </div>

      <SellerPriceInfo auctionStatistics={auctionStatistics} />
      <BidFeed auctionStatistics={auctionStatistics} />
    </div>
  );
}
