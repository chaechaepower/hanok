import { FaCrown } from 'react-icons/fa6';
import type { AuctionStatisticsPayload } from '@/types';

interface Props {
  auctionStatistics: AuctionStatisticsPayload | null;
}

function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

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

export default function BidFeed({ auctionStatistics }: Props) {
  const bids = auctionStatistics?.recentBids ?? [];

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-[rgba(255,255,255,.06)] pt-5">
      {/* 라벨 + 구분선 */}
      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.06em] text-[#a1a1aa]">
        실시간 입찰
        <div className="h-px flex-1 bg-linear-to-r from-[rgba(255,255,255,.08)] to-transparent" />
      </div>

      {/* 입찰 목록 */}
      <div className="bid-feed-scroll flex flex-col gap-1 overflow-y-auto">
        {bids.length === 0 ? (
          <div className="rounded-xl border border-[rgba(255,255,255,.04)] bg-[rgba(255,255,255,.02)] px-3 py-4 text-center text-[11px] font-medium text-[#71717a]">
            아직 수신된 입찰 데이터가 없습니다.
          </div>
        ) : (
          bids.map((bid, idx) => {
            const formattedTime = formatPlacedAt(bid.placedAt);
            const isTop = idx === 0;

            return (
              <div
                key={`${bid.nickname}-${bid.placedAt}-${bid.amount}-${idx}`}
                className={`flex min-h-9 items-center gap-2 rounded-xl px-2.5 ${
                  isTop
                    ? 'border border-[rgba(197,160,89,.18)] bg-[rgba(197,160,89,.06)]'
                    : 'border border-[rgba(255,255,255,.04)] bg-[rgba(255,255,255,.02)]'
                }`}
              >
                <span className="flex w-8 shrink-0 items-center tabular-nums">
                  {/* 방송 진행시간 구현 시 그때 분초로 바꾸기 */}
                  <span className="text-[9px] font-semibold text-[#71717a]">
                    {formattedTime.main} : {formattedTime.sec}
                  </span>
                </span>
                <span
                  className={`w-20 shrink-0 overflow-hidden py-0.5 text-[11px] font-bold whitespace-nowrap text-ellipsis ${isTop ? 'text-white' : 'text-[#a1a1aa]'}`}
                >
                  {bid.nickname}
                </span>
                <span
                  className={`ml-auto shrink-0 font-mono text-[11px] font-black ${isTop ? 'text-[#C5A059]' : 'text-[#71717a]'}`}
                >
                  {formatPrice(bid.amount)}
                </span>
                {isTop && (
                  <span className="flex shrink-0 items-center">
                    <FaCrown size={12} className="text-[#C5A059]" />
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
