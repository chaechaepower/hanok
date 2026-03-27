import Logo from '@/assets/Logo.png';

import { SCHEDULED_BADGE_LABEL } from '@/constants/liveCard';

type Props = {
  title: string;
  thumbnailUri?: string | null;
  canNavigate: boolean;
  isScheduledCard: boolean;
  isLiveStream: boolean;
  scheduledAtLabel: string;
  resolvedStatusBadge?: {
    label: string;
    className: string;
  };
  viewerCount: number;
};

export default function LiveCardPreview({
  title,
  thumbnailUri,
  canNavigate,
  isScheduledCard,
  isLiveStream,
  scheduledAtLabel,
  resolvedStatusBadge,
  viewerCount,
}: Props) {
  const livePreviewClassName = `relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-neutral-900 ${
    canNavigate ? 'cursor-pointer' : ''
  }`.trim();

  return (
    <div className={livePreviewClassName}>
      <img
        src={thumbnailUri ?? Logo}
        alt={title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-105"
      />

      {!resolvedStatusBadge && isScheduledCard && scheduledAtLabel && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-linear-to-b from-black/70 via-black/45 to-black/75">
          <div className="px-4 text-center text-warm">
            <p className="text-[36px] font-semibold leading-none tracking-[-0.02em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
              {scheduledAtLabel}
            </p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.01em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
              {SCHEDULED_BADGE_LABEL}
            </p>
          </div>
        </div>
      )}

      {resolvedStatusBadge ? (
        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-semibold ${resolvedStatusBadge.className}`}
        >
          {resolvedStatusBadge.label}
        </span>
      ) : (
        isLiveStream &&
        !isScheduledCard && (
          <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
            Live · {viewerCount.toLocaleString()}
          </span>
        )
      )}
    </div>
  );
}
