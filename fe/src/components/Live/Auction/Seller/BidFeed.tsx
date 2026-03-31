import { memo, useEffect, useMemo, useState } from 'react';
import { FaCrown } from 'react-icons/fa6';

import type { AuctionStatisticsPayload } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import { areRecentBidsEqual, isRecentBidEqual } from '@/utils/liveEquality';

interface Props {
  recentBids: AuctionStatisticsPayload['recentBids'];
  currentUserId: number | null;
}

interface BidFeedRowProps {
  bid: AuctionStatisticsPayload['recentBids'][number];
  index: number;
  currentUserId: number | null;
}

const BID_FEED_COALESCE_MS = 75;

function formatPlacedAt(placedAt: string) {
  const normalizedPlacedAt = placedAt.replace('T', ' ');
  const [, timePart = ''] = normalizedPlacedAt.split(' ');
  const timeSegments = timePart.split(':');
  const minute = timeSegments[1] ?? '00';
  const seconds = timeSegments[2] ?? '00';

  return {
    main: minute.slice(0, 2),
    sec: seconds.slice(0, 2),
  };
}

const BidFeedRow = memo(
  function BidFeedRow({ bid, index, currentUserId }: BidFeedRowProps) {
    const formattedTime = formatPlacedAt(bid.placedAt);
    const isTop = index === 0;
    const isCurrentUser = currentUserId !== null && bid.userId === currentUserId;

    return (
      <div
        className={`flex min-h-9 items-center gap-2 rounded-xl px-2.5 ${
          isTop ? 'border border-gold/18 bg-gold/6' : 'border border-white/4 bg-surface'
        }`}
      >
        <span className="flex w-10 shrink-0 items-center tabular-nums whitespace-nowrap">
          <span className="text-caption font-semibold text-neutral-500">
            {formattedTime.main}:{formattedTime.sec}
          </span>
        </span>
        <span
          className={`w-20 shrink-0 overflow-hidden py-0.5 text-label whitespace-nowrap text-ellipsis ${
            isCurrentUser ? 'font-black text-gold' : isTop ? 'font-bold text-white' : 'font-bold text-neutral-400'
          }`}
        >
          {bid.nickname}
        </span>
        <span
          className={`ml-auto min-w-0 truncate font-mono text-label font-black ${
            isTop ? 'text-gold' : 'text-neutral-500'
          }`}
        >
          {formatPrice(bid.amount)}
        </span>
        {isTop && (
          <span className="flex shrink-0 items-center">
            <FaCrown size={12} className="text-gold" />
          </span>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.index === next.index && prev.currentUserId === next.currentUserId && isRecentBidEqual(prev.bid, next.bid),
);

function BidFeed({ recentBids, currentUserId }: Props) {
  const memoizedRecentBids = useMemo(() => recentBids, [recentBids]);
  const [displayBids, setDisplayBids] = useState<AuctionStatisticsPayload['recentBids']>(memoizedRecentBids);

  useEffect(() => {
    if (areRecentBidsEqual(displayBids, memoizedRecentBids)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDisplayBids(memoizedRecentBids);
    }, BID_FEED_COALESCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [displayBids, memoizedRecentBids]);

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-white/6 pt-5">
      <div className="flex items-center gap-2 text-label font-extrabold uppercase tracking-[.06em] text-neutral-400">
        실시간 입찰
        <div className="h-px flex-1 bg-linear-to-r from-white/6 to-transparent" />
      </div>

      <div className="bid-feed-scroll flex flex-col gap-1 overflow-y-auto">
        {displayBids.length === 0 ? (
          <div className="rounded-xl border border-white/4 bg-surface px-3 py-4 text-center text-label font-medium text-neutral-500">
            아직 수신된 입찰 데이터가 없습니다
          </div>
        ) : (
          displayBids.map((bid, idx) => (
            <BidFeedRow
              key={`${bid.userId}-${bid.nickname}-${bid.placedAt}-${bid.amount}-${idx}`}
              bid={bid}
              index={idx}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(BidFeed, (prev, next) => {
  return prev.currentUserId === next.currentUserId && areRecentBidsEqual(prev.recentBids, next.recentBids);
});
