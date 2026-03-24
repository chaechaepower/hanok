import { ArrowRight } from 'lucide-react';

import Logo from '@/assets/Logo.png';
import { getCategoryLabel } from '@/constants/category';
import type { LiveCardData } from '@/types';

import { getViewerLabel } from './types';

type Props = {
  stream: LiveCardData;
  onNavigateLive: (streamId: number) => void;
  onNavigateSeller: (sellerId: number) => void;
};

export default function FollowingBannerFeaturedCard({ stream, onNavigateLive, onNavigateSeller }: Props) {
  const sellerInitial = stream.seller.nickname.trim().charAt(0) || '?';
  const canNavigateToProfile = stream.seller.sellerId > 0;

  return (
    <div className="group relative min-h-[360px] overflow-hidden rounded-(--radius-panel) bg-surface text-left">
      <img
        src={stream.thumbnailUri ?? Logo}
        alt={stream.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/45 to-background/80" />

      <div className="relative z-10 flex h-full flex-col justify-between p-8">
        <button
          type="button"
          onClick={() => {
            if (!canNavigateToProfile) {
              return;
            }
            onNavigateSeller(stream.seller.sellerId);
          }}
          disabled={!canNavigateToProfile}
          className={`flex items-center gap-3 text-left ${canNavigateToProfile ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {stream.seller.profileImageUri ? (
            <img
              src={stream.seller.profileImageUri}
              alt={`${stream.seller.nickname} profile`}
              className="h-16 w-16 rounded-full border-2 border-primary-light/35 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-light/20 bg-primary-muted text-xl font-semibold text-warm">
              {sellerInitial}
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-warm/85">{stream.seller.nickname}</p>
            <p className="mt-1 text-[15px] font-medium text-neutral-300">{getCategoryLabel(stream.category)}</p>
          </div>
        </button>

        <div className="flex items-end justify-between gap-6">
          <div className="max-w-[72%]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">LIVE</span>
              <span className="rounded-full bg-surface-elevated/80 px-3 py-1 text-xs font-medium text-neutral-200">
                {getViewerLabel(stream.viewerCount)}
              </span>
            </div>

            <h3 className="text-[38px] font-semibold leading-[1.12] tracking-[-0.03em] text-warm">{stream.title}</h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateLive(stream.streamId)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent/20 px-5 py-3 text-sm font-semibold text-accent-light transition hover:bg-accent/30"
          >
            <span>바로 입장</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
