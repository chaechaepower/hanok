import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useGetMe } from '@/api/hooks/useGetMe';
import bannerFrame from '@/assets/banner.png';

import FollowingBannerFeaturedCard from './followingBanner/FollowingBannerFeaturedCard';
import FollowingBannerHeader from './followingBanner/FollowingBannerHeader';
import FollowingBannerStreamItem from './followingBanner/FollowingBannerStreamItem';
import type { FollowingBannerProps } from './followingBanner/types';

const bannerShellClassName =
  'relative overflow-hidden rounded-(--radius-section) bg-surface-elevated px-8 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.24)]';

export default function FollowingBanner({ streams }: FollowingBannerProps) {
  const navigate = useNavigate();
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const { data: meData } = useGetMe({ enabled: true });
  const bannerTitle = meData?.nickname ? `${meData.nickname}님의 단골 상점 경매` : '나의 단골 상점 경매';

  if (streams.length === 0) {
    return (
      <section className={bannerShellClassName}>
        <img
          src={bannerFrame}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill opacity-80"
        />

        <div className="relative z-10 px-8 py-8">
          <FollowingBannerHeader title={bannerTitle} description="팔로우 중인 판매자의 라이브 방송이 아직 없습니다" />
        </div>
      </section>
    );
  }

  const featuredStream = streams.find((stream) => stream.streamId === selectedStreamId) ?? streams[0];

  return (
    <section className={bannerShellClassName}>
      <img
        src={bannerFrame}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill opacity-80"
      />

      <div className="relative z-10 px-2 py-2">
        <div className="mb-6 px-2 pt-2">
          <FollowingBannerHeader title={bannerTitle} description="팔로우 중인 상점의 실시간 경매를 살펴보세요!" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_320px]">
          <FollowingBannerFeaturedCard
            stream={featuredStream}
            onNavigateLive={(streamId) => navigate(`/live/${streamId}`)}
            onNavigateSeller={(sellerId) => navigate(`/profile/${sellerId}`)}
          />

          <div className="overflow-hidden rounded-(--radius-panel) border border-[#a38c68]/15 bg-surface">
            <div className="custom-scrollbar flex max-h-[360px] flex-col gap-3 overflow-y-auto p-3">
              {streams.map((stream) => (
                <FollowingBannerStreamItem
                  key={stream.streamId}
                  stream={stream}
                  isSelected={stream.streamId === featuredStream.streamId}
                  onClick={() => setSelectedStreamId(stream.streamId)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
