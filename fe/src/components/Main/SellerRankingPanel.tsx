import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
          <p className="text-[14px] font-semibold leading-tight text-warm">인기 상점</p>
          <p className="mt-0.5 text-[12px] leading-tight text-neutral-500">현재 인기있는 상점!</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {rankingItems.map((seller) => {
          const sellerInitial = seller.nickname.trim().charAt(0) || '?';

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
                  alt={`${seller.nickname} profile`}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-warm">
                  {sellerInitial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight text-warm">{seller.nickname}</p>
                <p className="mt-0.5 text-[12px] leading-tight text-neutral-500">
                  팔로워 {seller.followerCount.toLocaleString()}명
                </p>
              </div>
            </button>
          );
        })}

        {rankingItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-primary-dark/30 px-4 py-6 text-center text-[13px] text-neutral-500">
            랭킹 정보를 불러오는 중입니다
          </div>
        )}
      </div>
    </section>
  );
}
