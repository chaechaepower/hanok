import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import FallbackImg from '@/components/common/FallbackImg';
import PictureWithFallback from '@/components/common/PictureWithFallback';
import bannerFrame from '@/assets/banner.png';
import bannerFrameWebp from '@/assets/banner.webp';
import useInfiniteScrollTrigger from '@/hooks/useInfiniteScrollTrigger';

import FollowingBannerFeaturedCard from './followingBanner/FollowingBannerFeaturedCard';
import FollowingBannerStreamItem from './followingBanner/FollowingBannerStreamItem';
import type { FollowingBannerProps } from './followingBanner/types';

const bannerShellClassName =
  'relative overflow-hidden bg-surface-elevated px-8 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.24)]';

export default function FollowingBanner({ streams, hasNextPage, isFetchingNextPage, fetchNextPage }: FollowingBannerProps) {
  const navigate = useNavigate();
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScrollTrigger({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    triggerRef,
    rootRef: listRef,
    rootMargin: '0px 0px 160px 0px',
  });

  if (streams.length === 0) {
    return (
      <section className={bannerShellClassName}>
        <PictureWithFallback
          webpSrc={bannerFrameWebp}
          fallbackSrc={bannerFrame}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-x-0 inset-y-[10px] m-auto z-0 h-[calc(100%-20px)] w-[calc(100%-24px)] object-fill opacity-80"
        />

        <div className="relative z-10 flex min-h-[420px] items-center justify-center px-8 py-8 text-center">
          <div className="text-[22px] text-white" style={{ textShadow: '0 4px 14px rgba(0,0,0,0.72)' }}>
            <p>팔로우 중인 판매자의 라이브 방송이 없습니다.</p>
            <p>다른 판매자를 팔로우 해보세요!</p>
          </div>
        </div>
      </section>
    );
  }

  const featuredStream = streams.find((stream) => stream.streamId === selectedStreamId) ?? streams[0];

  return (
    <section className={bannerShellClassName}>
      <FallbackImg
        src={featuredStream.thumbnailUri}
        alt={featuredStream.title}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-x-0 inset-y-[10px] m-auto z-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.1)_30%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_30%)]" />
      <div className="absolute inset-y-0 right-0 z-0 hidden w-[42%] bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.08)_8%,rgba(0,0,0,0.18)_16%,rgba(0,0,0,0.34)_26%,rgba(0,0,0,0.56)_40%,rgba(0,0,0,0.8)_58%,rgba(0,0,0,0.94)_76%,rgba(0,0,0,0.99)_100%)] xl:block" />
      <PictureWithFallback
        webpSrc={bannerFrameWebp}
        fallbackSrc={bannerFrame}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 m-auto inset-y-[10px] z-30 h-[calc(100%-20px)] w-[calc(100%-24px)] object-fill opacity-80"
      />

      <div className="relative z-20 min-h-[420px] px-2 py-2">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.75fr)_320px]">
          <FollowingBannerFeaturedCard
            stream={featuredStream}
            onNavigateLive={(streamId) => navigate(`/live/${streamId}`)}
            onNavigateSeller={(sellerId) => navigate(`/profile/${sellerId}`)}
          />
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-[320px] xl:block">
          <div ref={listRef} className="custom-scrollbar flex h-full flex-col gap-1 overflow-y-auto px-3 py-3">
            {streams.map((stream) => (
              <FollowingBannerStreamItem
                key={stream.streamId}
                stream={stream}
                isSelected={stream.streamId === featuredStream.streamId}
                onClick={() => setSelectedStreamId(stream.streamId)}
              />
            ))}
            {hasNextPage && <div ref={triggerRef} className="h-6 w-full shrink-0" aria-hidden />}
            {isFetchingNextPage && (
              <p className="px-2 py-2 text-center text-xs text-neutral-400">팔로우 라이브를 더 불러오는 중입니다</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
