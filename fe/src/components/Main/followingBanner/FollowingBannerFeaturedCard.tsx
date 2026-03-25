import { getCategoryLabel } from '@/constants/category';
import type { LiveCardData } from '@/types';

import { getViewerLabel } from './types';
import { MdLiveTv } from 'react-icons/md';

type Props = {
  stream: LiveCardData;
  onNavigateLive: (streamId: number) => void;
  onNavigateSeller: (sellerId: number) => void;
};

export default function FollowingBannerFeaturedCard({ stream, onNavigateLive, onNavigateSeller }: Props) {
  const sellerInitial = stream.seller.nickname.trim().charAt(0) || '?';
  const canNavigateToProfile = stream.seller.sellerId > 0;

  return (
    <div className="group relative min-h-[380px] overflow-hidden text-left">
      <div className={`relative z-10 flex h-full flex-col justify-between pt-4 px-2`}>
        <button
          type="button"
          onClick={() => {
            if (!canNavigateToProfile) {
              return;
            }
            onNavigateSeller(stream.seller.sellerId);
          }}
          disabled={!canNavigateToProfile}
          className={`inline-flex max-w-fit items-center gap-3 rounded-[24px] py-2 text-left] ${
            canNavigateToProfile ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          {stream.seller.profileImageUri ? (
            <img
              src={stream.seller.profileImageUri}
              alt={`${stream.seller.nickname} profile`}
              className={`h-16 w-16 rounded-full object-coverborder-2 border-white/25`}
            />
          ) : (
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold
                border-2 border-white/20 bg-black/35 text-white`}
            >
              {sellerInitial}
            </div>
          )}

          <div>
            <p className={`text-price-md font-bold text-start text-white`}>{stream.seller.nickname}</p>
            <p className={`text-body-md font-medium  text-start text-white`}>{getCategoryLabel(stream.category)}</p>
          </div>
        </button>

        <div className="flex items-end justify-between gap-6">
          <div className="max-w-[72%]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">LIVE</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium
                bg-black/45 text-white/84`}
              >
                {getViewerLabel(stream.viewerCount)}
              </span>
            </div>

            <h3 className="text-[38px] font-semibold leading-[1.12] tracking-[-0.03em] text-white">{stream.title}</h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateLive(stream.streamId)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-accent/90 px-5 py-3 text-sm font-semibold text-warm transition hover:bg-accent`}
          >
            <MdLiveTv size={17} />
            <span>방송 입장</span>
          </button>
        </div>
      </div>
    </div>
  );
}
