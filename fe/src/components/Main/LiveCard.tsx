import type { LiveCardData } from '@/types';
import { useNavigate } from 'react-router-dom';

type LiveCardProps = {
  stream: LiveCardData;
  className?: string;
  statusBadge?: {
    label: string;
    className: string;
  };
  isNavigable?: boolean;
  disableSellerNavigation?: boolean;
  metaText?: string;
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  SNEAKERS: '스니커즈/신발',
  WATCH: '시계',
  FIGURE: '피규어/아트토이/굿즈',
  APPAREL: '의류',
  BAG: '가방/패션잡화',
  JEWELRY: '주얼리',
  CARD: '트레이딩 카드',
  ELECTRONICS: '전자기기',
  ART: '미술품/판화',
  ANTIQUE: '골동품/앤틱',
  ETC: '기타',
};

const SCHEDULED_BADGE_LABEL = '방송예정';

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
  metaText,
}: LiveCardProps) {
  const navigate = useNavigate();
  const sellerInitial = stream.seller.nickname.trim().charAt(0) || '?';
  const categoryLabel = CATEGORY_LABEL_MAP[stream.category] ?? stream.category;
  const isScheduledCard = stream.scheduledAt !== null;
  const scheduledAtLabel = formatScheduledAt(stream.scheduledAt);
  const canNavigate = isNavigable ?? (stream.isLive && !isScheduledCard);
  const canNavigateToProfile = !disableSellerNavigation && stream.seller.sellerId > 0;
  const containerClassName = `group w-full max-w-[230px] ${className}`.trim();
  const livePreviewClassName = `relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-[#111827] ${
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
      <div
        className={livePreviewClassName}
        onClick={canNavigate ? handleLiveClick : undefined}
        onKeyDown={canNavigate ? handleLiveKeyDown : undefined}
        role={canNavigate ? 'link' : undefined}
        tabIndex={canNavigate ? 0 : undefined}
      >
        {stream.thumbnailUri ? (
          <img
            src={stream.thumbnailUri}
            alt={stream.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-500 text-[13px] font-medium tracking-[0.08em] text-white/50">
            LIVE THUMBNAIL
          </div>
        )}

        {!statusBadge && isScheduledCard && scheduledAtLabel && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-linear-to-b from-black/70 via-black/45 to-black/75">
            <div className="px-4 text-center text-point">
              <p className="text-[36px] font-semibold leading-none tracking-[-0.02em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                {scheduledAtLabel}
              </p>
              <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.01em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                {SCHEDULED_BADGE_LABEL}
              </p>
            </div>
          </div>
        )}

        {statusBadge ? (
          <span
            className={`absolute left-3 top-3 rounded-md px-2.5 py-1.5 text-[12px] font-semibold ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        ) : (
          stream.isLive &&
          !isScheduledCard && (
            <span className="absolute left-3 top-3 rounded-md bg-[#EF4444] px-2.5 py-1.5 text-[12px] font-semibold text-white">
              Live · {stream.viewerCount.toLocaleString()}
            </span>
          )
        )}
      </div>

      <button
        type="button"
        onClick={handleSellerClick}
        disabled={!canNavigateToProfile}
        className={`mt-5 flex w-full items-start gap-3 text-left ${
          canNavigateToProfile ? 'cursor-pointer' : 'cursor-default'
        } disabled:pointer-events-none`}
      >
        {stream.seller.profileImageUri ? (
          <img
            src={stream.seller.profileImageUri}
            alt={`${stream.seller.nickname} profile`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-[16px] font-semibold text-point">
            {sellerInitial}
          </div>
        )}

        <div className="min-w-0 flex flex-col gap-2">
          <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-normal leading-none text-point">
            {stream.title}
          </h3>
          {metaText ? (
            <p className="text-[14px] font-light leading-none text-point">{metaText}</p>
          ) : (
            <p className="text-[14px] font-light leading-none text-point">
              <span>{stream.seller.nickname}</span>
              <span className="mx-1 text-gold">|</span>
              <span className="text-gold">{categoryLabel}</span>
            </p>
          )}
        </div>
      </button>
    </article>
  );
}
