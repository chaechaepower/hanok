import { Info, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import InfoPanelTooltip from '@/components/common/InfoPanelTooltip';
import type { SellerRankingItem } from '@/types';

type SellerRankingPanelProps = {
  rankingItems?: SellerRankingItem[];
};

export default function SellerRankingPanel({ rankingItems = [] }: SellerRankingPanelProps) {
  const navigate = useNavigate();

  return (
    <section className="rounded-(--radius-panel) bg-surface-elevated p-4">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-point/15 text-point">
          <Trophy size={18} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-semibold leading-tight text-warm">인기상점</p>
            <div className="group relative flex items-center">
              <button
                type="button"
                aria-label="인기상점 산정 기준"
                className="flex h-4 w-4 items-center justify-center rounded-full text-neutral-500 transition hover:text-neutral-300"
              >
                <Info size={13} />
              </button>
              <InfoPanelTooltip title="인기상점 산정 기준" placementClassName="top-full left-0 mt-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>최근 판매 실적 40%</li>
                  <li>팔로워 30%</li>
                  <li>평점 20%</li>
                  <li>패널티 감점 10%</li>
                </ul>
              </InfoPanelTooltip>
            </div>
          </div>
          <p className="mt-0.5 text-[12px] leading-tight text-neutral-500">현재 인기있는 상점!</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {rankingItems.map((seller) => {
          const sellerInitial = seller.shopName.trim().charAt(0) || '?';

          return (
            <button
              key={seller.sellerId}
              type="button"
              onClick={() => navigate(`/profile/${seller.sellerId}`)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition hover:bg-surface"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-point/15 text-[13px] font-semibold text-point">
                {seller.rank}
              </div>

              {seller.profileImage ? (
                <img
                  src={seller.profileImage}
                  alt={`${seller.shopName} profile`}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-warm">
                  {sellerInitial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight text-warm">{seller.shopName}</p>
                <p className="mt-0.5 text-[12px] leading-tight text-neutral-500">
                  팔로워 {seller.followerCount.toLocaleString()}명
                </p>
              </div>
            </button>
          );
        })}

        {rankingItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-primary-dark/30 px-4 py-6 text-center text-[13px] text-neutral-500">
            아직 표시할 인기상점이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
