import { Eye } from 'lucide-react';

import Logo from '@/assets/Logo.png';
import type { LiveCardData } from '@/types';

import { getViewerLabel } from './types';

type Props = {
  stream: LiveCardData;
  isSelected: boolean;
  onClick: () => void;
};

export default function FollowingBannerStreamItem({ stream, isSelected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-(--radius-panel) p-3 text-left transition ${
        isSelected
          ? 'bg-primary-muted/45 shadow-[0_10px_24px_rgba(0,0,0,0.18)]'
          : 'bg-background/40 hover:bg-primary-muted/30'
      }`}
    >
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl bg-neutral-800">
        <img src={stream.thumbnailUri ?? Logo} alt={stream.title} className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-warm">{stream.seller.nickname}</p>
        <p className="mt-1 line-clamp-2 text-[13px] text-neutral-300">{stream.title}</p>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-neutral-500">
          <Eye size={14} />
          <span>{getViewerLabel(stream.viewerCount)}</span>
        </div>
      </div>
    </button>
  );
}
