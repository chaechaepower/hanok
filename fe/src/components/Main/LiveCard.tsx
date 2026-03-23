import { getCategoryLabel } from '@/constants/category';
import type { LiveCardData, SearchStreamStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import Logo from '@/assets/Logo.png';

type LiveCardProps = {
  stream: LiveCardData;
  className?: string;
  statusBadge?: {
    label: string;
    className: string;
  };
  isNavigable?: boolean;
  disableSellerNavigation?: boolean;
};

const SCHEDULED_BADGE_LABEL = '방송예정';

const STREAM_STATUS_META_MAP: Record<SearchStreamStatus, { label: string; badgeClassName: string; canEnter: boolean }> =
  {
    LIVE: {
      label: 'LIVE',
      badgeClassName: 'bg-[#EF4444] text-white',
      canEnter: true,
    },
    SCHEDULED: {
      label: SCHEDULED_BADGE_LABEL,
      badgeClassName: 'bg-gold/20 text-gold-light',
      canEnter: false,
    },
    PAUSED: {
      label: '일시정지',
      badgeClassName: 'bg-ember/20 text-ember-light',
      canEnter: true,
    },
    ENDED: {
      label: '종료됨',
      badgeClassName: 'bg-white/12 text-white/70',
      canEnter: false,
    },
  };

const formatScheduledAt = (scheduledAt: string | null) => {
  if (!scheduledAt) return null;

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return scheduledAt;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${month}/${day} ${hour}:${minute}`;
};

export default function LiveCard({
  stream,
  className = '',
  statusBadge,
  isNavigable,
  disableSellerNavigation = false,
}: LiveCardProps) {
  const navigate = useNavigate();
  const statusMeta = STREAM_STATUS_META_MAP[stream.streamStatus];
  const sellerInitial = stream.seller.nickname.trim().charAt(0) || '?';
  const categoryLabel = getCategoryLabel(stream.category);
  const isScheduledCard = stream.streamStatus === 'SCHEDULED';
  const isLiveStream = stream.streamStatus === 'LIVE';
  const scheduledAtLabel = formatScheduledAt(stream.scheduledAt);
  const resolvedStatusBadge =
    statusBadge ??
    (stream.streamStatus === 'PAUSED' || stream.streamStatus === 'ENDED'
      ? {
          label: statusMeta.label,
          className: statusMeta.badgeClassName,
        }
      : undefined);
  const canNavigate = isNavigable ?? statusMeta.canEnter;
  const canNavigateToProfile = !disableSellerNavigation && stream.seller.sellerId > 0;
  const containerClassName = `group flex w-full max-w-[280px] flex-col ${className}`.trim();
  const livePreviewClassName = `relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-neutral-900 ${
    canNavigate ? 'cursor-pointer' : ''
  }`.trim();

  const handleLiveClick = () => {
    if (!canNavigate) {
      return;
    }

    navigate(`/live/${stream.streamId}`);
  };

  const handleLiveKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!canNavigate) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/live/${stream.streamId}`);
    }
  };

  const handleSellerClick = () => {
    if (!canNavigateToProfile) {
      return;
    }

    navigate(`/profile/${stream.seller.sellerId}`);
  };

  return (
    <article className={containerClassName}>
      <button
        type="button"
        onClick={handleSellerClick}
        disabled={!canNavigateToProfile}
        className={`mb-1 flex w-full items-center gap-2.5 rounded-xl bg-transparent px-1 py-1 text-left transition-colors ${
          canNavigateToProfile ? 'cursor-pointer' : 'cursor-default'
        } disabled:pointer-events-none`}
      >
        {stream.seller.profileImageUri ? (
          <img
            src={stream.seller.profileImageUri}
            alt={`${stream.seller.nickname} profile`}
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[14px] font-semibold text-primary-light">
            {sellerInitial}
          </div>
        )}

        <span className="min-w-0 truncate text-[14px] font-medium leading-none text-neutral-200">
          {stream.seller.nickname}
        </span>
      </button>

      <button
        type="button"
        onClick={handleLiveClick}
        onKeyDown={handleLiveKeyDown}
        disabled={!canNavigate}
        className={`w-full border-none bg-transparent p-0 text-left ${
          canNavigate ? 'cursor-pointer' : 'cursor-default'
        } disabled:pointer-events-none`}
      >
        <div className={livePreviewClassName}>
          <img
            src={stream.thumbnailUri ?? Logo}
            alt={stream.title}
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
                Live · {stream.viewerCount.toLocaleString()}
              </span>
            )
          )}
        </div>

        <div className="mt-3 flex min-w-0 flex-col gap-1 px-1">
          <h3 className="truncate text-[15px] font-medium leading-[1.35] text-warm">{stream.title}</h3>
          <p className="truncate text-[13px] font-normal leading-none text-neutral-500">{categoryLabel}</p>
        </div>
      </button>
    </article>
  );
}
