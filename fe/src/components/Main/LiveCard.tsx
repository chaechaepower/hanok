import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { getCategoryLabel } from '@/constants/category';
import type { LiveCardData } from '@/types';
import { formatScheduledDateTime } from '@/utils/formatDateTime';

import LiveCardPreview from './liveCard/LiveCardPreview';
import LiveCardSeller from './liveCard/LiveCardSeller';
import { STREAM_STATUS_META_MAP } from '@/constants/liveCard';

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

export default function LiveCard({
  stream,
  className = '',
  statusBadge,
  isNavigable,
  disableSellerNavigation = false,
}: LiveCardProps) {
  const navigate = useNavigate();
  const statusMeta = STREAM_STATUS_META_MAP[stream.streamStatus];
  const categoryLabel = getCategoryLabel(stream.category);
  const isScheduledCard = stream.streamStatus === 'SCHEDULED';
  const isLiveStream = stream.streamStatus === 'LIVE';
  const scheduledAtLabel = formatScheduledDateTime(stream.scheduledAt);
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

  const handleLiveClick = () => {
    if (!canNavigate) {
      return;
    }

    navigate(`/live/${stream.streamId}`);
  };

  const handleLiveKeyDown = (event: KeyboardEvent<HTMLElement>) => {
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
      <LiveCardSeller
        nickname={stream.seller.nickname}
        profileImageUri={stream.seller.profileImageUri}
        canNavigateToProfile={canNavigateToProfile}
        onSellerClick={handleSellerClick}
      />

      <button
        type="button"
        onClick={handleLiveClick}
        onKeyDown={handleLiveKeyDown}
        disabled={!canNavigate}
        className={`w-full border-none bg-transparent p-0 text-left ${
          canNavigate ? 'cursor-pointer' : 'cursor-default'
        } disabled:pointer-events-none`}
      >
        <LiveCardPreview
          title={stream.title}
          thumbnailUri={stream.thumbnailUri}
          canNavigate={canNavigate}
          isScheduledCard={isScheduledCard}
          isLiveStream={isLiveStream}
          scheduledAtLabel={scheduledAtLabel}
          resolvedStatusBadge={resolvedStatusBadge}
          viewerCount={stream.viewerCount}
        />

        <div className="mt-3 flex min-w-0 flex-col gap-1 px-1">
          <h3 className="truncate text-[15px] font-medium leading-[1.35] text-warm">{stream.title}</h3>
          <p className="truncate text-[13px] font-normal leading-none text-neutral-500">{categoryLabel}</p>
        </div>
      </button>
    </article>
  );
}
