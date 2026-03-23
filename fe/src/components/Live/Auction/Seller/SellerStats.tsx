import { FaArrowTrendUp } from 'react-icons/fa6';
import type { AuctionStatisticsPayload } from '@/types';

interface Props {
  auctionStatistics: AuctionStatisticsPayload | null;
  riseRate: number;
}

export default function SellerStats({ auctionStatistics, riseRate }: Props) {
  return (
    <div className="space-y-4">
      {/* 참여 입찰수 / 상승폭 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-neutral-900 p-4 text-center">
          <div className="text-caption font-bold text-neutral-500">참여 입찰수</div>
          <div className="mt-1 text-xl font-black text-neutral-100">
            <span className="tabular-nums font-black">{auctionStatistics?.bidCount ?? 0}</span>{' '}
            <span className="text-sm font-normal text-neutral-600">건</span>
          </div>
        </div>
        <div className="rounded-2xl bg-neutral-900 p-4 text-center">
          <div className="text-caption font-bold text-neutral-500">상승폭</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-xl font-black text-accent-light">
            <FaArrowTrendUp size={17} />
            <span className="tabular-nums font-black">{riseRate.toFixed(2)}</span>
            <span className="tabular-nums font-black">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
