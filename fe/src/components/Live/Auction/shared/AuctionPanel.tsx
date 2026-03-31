import { memo, useMemo } from 'react';

import SellerStats from '../Seller/SellerStats';
import SellerPriceInfo from '../Seller/SellerPriceInfo';
import BidFeed from '../Seller/BidFeed';
import { useLiveAuctionStatistics, useLiveUniqueBidSync } from '@/hooks/useLiveHotState';
import type { LiveAuctionType } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

interface Props {
  isSeller: boolean;
  auctionType: LiveAuctionType | null;
}

function AuctionPanel({ isSeller, auctionType }: Props) {
  const auctionStatistics = useLiveAuctionStatistics();
  const uniqueBidSync = useLiveUniqueBidSync();
  const currentUserId = useMemo(() => {
    const stored = localStorage.getItem('userId');
    const parsed = stored ? Number(stored) : NaN;
    return Number.isNaN(parsed) ? null : parsed;
  }, []);

  if (auctionType === 'UNIQUE_TOP') {
    const bidRange = uniqueBidSync?.bidRange;

    return (
      <div className="bid-feed-scroll flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="rounded-2xl bg-neutral-900 p-5">
          <div className="text-label font-bold uppercase tracking-tighter text-neutral-500">유일 최고가 경매</div>
          <div className="mt-2 text-3xl font-black text-ember">
            <span className="tabular-nums font-black">{uniqueBidSync?.participantCount ?? 0}</span>
            <span className="ml-2 text-sm font-bold text-neutral-500">명 참여</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl bg-neutral-900 p-4">
            <div className="text-label font-bold text-neutral-500">입찰 범위</div>
            <div className="mt-2 text-sm font-black text-neutral-100">
              {bidRange
                ? `${formatPrice(bidRange.minPrice, { suffix: false })} ~ ${formatPrice(bidRange.maxPrice, { suffix: false })}`
                : '-'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-surface px-4 py-4">
          <div className="text-label font-bold tracking-[.08em] text-neutral-500">내역</div>
          <p className="mt-2 text-label whitespace-pre-line text-neutral-300">
            {isSeller
              ? '입찰 금액은 경매 종료 전까지 공개되지 않습니다. 참여 인원만 실시간으로 갱신됩니다.'
              : uniqueBidSync?.hasBid
                ? '이미 입찰을 완료했습니다.\n동일 상품에는 한 번만 입찰할 수 있습니다.'
                : '입찰 금액은 비공개입니다.\n제시된 범위 안에서 한 번만 입찰할 수 있습니다.'}
          </p>
        </div>
      </div>
    );
  }

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

      <div className="flex items-center gap-2.5">
        <div className="shrink-0 text-label font-extrabold uppercase tracking-[.08em] text-neutral-600">경매 상품</div>
        <div className="h-px flex-1 bg-linear-to-r from-white/6 to-transparent" />
      </div>

      <div className="-mt-2 flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-0.5 text-caption font-bold text-gold">경매중</span>
        <span className="min-w-0 truncate text-xs font-bold text-white">
          {auctionStatistics?.itemName ?? '데이터 수신 대기중'}
        </span>
      </div>

      <SellerPriceInfo auctionStatistics={auctionStatistics} />
      <BidFeed recentBids={auctionStatistics?.recentBids ?? []} currentUserId={currentUserId} />
    </div>
  );
}

export default memo(AuctionPanel, (prev, next) => {
  return prev.isSeller === next.isSeller && prev.auctionType === next.auctionType;
});
