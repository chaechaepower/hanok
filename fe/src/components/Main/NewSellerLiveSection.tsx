import { useRef } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import LiveCard from '@/components/Main/LiveCard';
import type { LiveCardData } from '@/types';

type NewSellerLiveSectionProps = {
  streams: LiveCardData[];
};

export default function NewSellerLiveSection({ streams }: NewSellerLiveSectionProps) {
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
    <section className="relative rounded-(--radius-section) bg-background px-6 pb-6 pt-6">
      <div className="mb-6">
        <div>
          <h2 className="text-[28px] font-semibold text-warm">신규 상점 경매</h2>
          <p className="mt-1 text-sm text-neutral-500">신규 상점의 경매도 살펴보세요!</p>
        </div>
      </div>

      {streams.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => scrollByOffset('left')}
            className="absolute left-3 top-[calc(50%+12px)] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-elevated text-warm shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-primary-muted"
            aria-label="신규 상점 경매 왼쪽으로 이동"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => scrollByOffset('right')}
            className="absolute right-3 top-[calc(50%+12px)] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-elevated text-warm shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-primary-muted"
            aria-label="신규 상점 경매 오른쪽으로 이동"
          >
            <ChevronRight size={18} />
          </button>

          <div ref={trackRef} className="scrollbar-hide flex gap-6 overflow-x-auto pb-2 scroll-smooth">
            {streams.map((broadcast) => (
              <div key={broadcast.streamId} className="w-[220px] shrink-0">
                <LiveCard stream={broadcast} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="py-16 text-center text-base text-neutral-500">신규 상점 경매가 없습니다.</p>
      )}
    </section>
  );
}
