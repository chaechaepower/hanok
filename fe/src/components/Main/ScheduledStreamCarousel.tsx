import { useRef } from 'react';

import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getCategoryLabel } from '@/constants/category';
import type { LiveCardData } from '@/types';

type ScheduledStreamCarouselProps = {
  streams: LiveCardData[];
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const formatScheduleLabel = (dateTime: string | null) => {
  if (!dateTime) {
    return '일정 미정';
  }

  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hour >= 12 ? '오후' : '오전';
  const displayHour = hour % 12 || 12;

  return `${month}/${day}(${DAY_LABELS[date.getDay()]}) ${meridiem} ${displayHour}:${minute}`;
};

export default function ScheduledStreamCarousel({ streams }: ScheduledStreamCarouselProps) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByOffset = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const offset = Math.min(track.clientWidth * 0.9, 960);
    track.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative rounded-(--radius-section) bg-surface px-6 pb-6 pt-5">
      <div className="mb-5">
        <h2 className="text-[28px] font-semibold text-warm">방송 예정 경매</h2>
        <p className="mt-1 text-sm text-neutral-500">
          예정된 경매를 살펴보세요! 상점을 팔로우하면 방송 시작 시 알림을 보내드려요
        </p>
      </div>

      {streams.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => scrollByOffset('left')}
            className="absolute left-3 top-[calc(50%+20px)] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-elevated text-warm shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-primary-muted"
            aria-label="예정 방송 왼쪽으로 이동"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => scrollByOffset('right')}
            className="absolute right-3 top-[calc(50%+20px)] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-elevated text-warm shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-primary-muted"
            aria-label="예정 방송 오른쪽으로 이동"
          >
            <ChevronRight size={18} />
          </button>

          <div ref={trackRef} className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 scroll-smooth">
            {streams.map((stream) => {
              const sellerInitial = stream.seller.nickname.trim().charAt(0) || '?';
              const canNavigateToProfile = stream.seller.sellerId > 0;

              return (
                <article
                  key={stream.streamId}
                  className="group relative flex min-w-[360px] max-w-[360px] items-center gap-4 rounded-(--radius-panel) bg-surface-elevated px-4 py-4 pt-5 text-left text-warm"
                >
                  <span className="absolute left-4 top-3 z-10 rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
                    LIVE
                  </span>

                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-primary-muted">
                    {stream.thumbnailUri ? (
                      <img
                        src={stream.thumbnailUri}
                        alt={stream.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : stream.seller.profileImageUri ? (
                      <img
                        src={stream.seller.profileImageUri}
                        alt={`${stream.seller.nickname} profile`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary-muted text-2xl font-semibold text-warm">
                        {sellerInitial}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="pl-14 text-[15px] font-semibold text-gold-light">
                      {formatScheduleLabel(stream.scheduledAt)}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-h2 font-semibold leading-[1.2] tracking-[-0.02em] text-warm">
                      {stream.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[13px] text-neutral-400">
                      <CalendarClock size={14} />
                      <div className="min-w-0 truncate">
                        <button
                          type="button"
                          onClick={() => {
                            if (!canNavigateToProfile) {
                              return;
                            }
                            navigate(`/profile/${stream.seller.sellerId}`);
                          }}
                          disabled={!canNavigateToProfile}
                          className={`max-w-full truncate text-left transition ${
                            canNavigateToProfile
                              ? 'cursor-pointer text-neutral-300 hover:text-gold-light'
                              : 'cursor-default text-neutral-300'
                          }`}
                        >
                          {stream.seller.nickname}
                        </button>
                        <span className="mx-1">·</span>
                        <span>{getCategoryLabel(stream.category)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex min-h-[160px] items-center justify-center rounded-(--radius-panel) border border-dashed border-primary-dark/30 text-sm text-neutral-500">
          예정된 경매가 없습니다
        </div>
      )}
    </section>
  );
}
