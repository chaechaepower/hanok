import { useState } from 'react';

import { ArrowRight, Eye } from 'lucide-react';
import { FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { useGetMe } from '@/api/hooks/useGetMe';
import Logo from '@/assets/Logo.png';
import { getCategoryLabel } from '@/constants/category';
import type { LiveCardData } from '@/types';

type FollowingBannerProps = {
  streams: LiveCardData[];
};

const getViewerLabel = (viewerCount: number) => `${viewerCount.toLocaleString()}명 시청 중`;

export default function FollowingBanner({ streams }: FollowingBannerProps) {
  const navigate = useNavigate();
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const { data: meData } = useGetMe({ enabled: true });
  const bannerTitle = meData?.nickname ? `${meData.nickname}님의 단골 상점 경매` : '나의 단골 상점 경매';

  if (streams.length === 0) {
    return (
      <section className="rounded-[32px] border border-primary-dark/30 bg-surface-elevated p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-point/15 text-point">
            <FaHeart size={18} />
          </div>
          <div>
            <h2 className="text-[26px] font-semibold text-warm">{bannerTitle}</h2>
            <p className="mt-1 text-sm text-neutral-500">팔로우한 상점의 진행 중인 경매가 없습니다</p>
          </div>
        </div>
      </section>
    );
  }

  const featuredStream = streams.find((stream) => stream.streamId === selectedStreamId) ?? streams[0];
  const sellerInitial = featuredStream.seller.nickname.trim().charAt(0) || '?';
  const canNavigateToProfile = featuredStream.seller.sellerId > 0;

  return (
    <section className="rounded-[32px] border border-primary-dark/30 bg-surface-elevated p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center gap-3 px-2 pt-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-point/15 text-point">
          <FaHeart size={18} />
        </div>
        <div>
          <h2 className="text-[26px] font-semibold text-warm">{bannerTitle}</h2>
          <p className="mt-1 text-sm text-neutral-500">팔로우한 상점의 실시간 경매를 한눈에 확인해보세요.</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_320px]">
        <div className="group relative min-h-[360px] overflow-hidden rounded-[28px] bg-surface text-left">
          <img
            src={featuredStream.thumbnailUri ?? Logo}
            alt={featuredStream.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/45 to-background/80" />

          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <button
              type="button"
              onClick={() => {
                if (!canNavigateToProfile) {
                  return;
                }
                navigate(`/profile/${featuredStream.seller.sellerId}`);
              }}
              disabled={!canNavigateToProfile}
              className={`flex items-center gap-3 text-left ${
                canNavigateToProfile ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {featuredStream.seller.profileImageUri ? (
                <img
                  src={featuredStream.seller.profileImageUri}
                  alt={`${featuredStream.seller.nickname} profile`}
                  className="h-16 w-16 rounded-full border-2 border-primary-light/35 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-light/20 bg-primary-muted text-xl font-semibold text-warm">
                  {sellerInitial}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-warm/85">{featuredStream.seller.nickname}</p>
                <p className="mt-1 text-[15px] font-medium text-neutral-300">
                  {getCategoryLabel(featuredStream.category)}
                </p>
              </div>
            </button>

            <div className="flex items-end justify-between gap-6">
              <div className="max-w-[72%]">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">LIVE</span>
                  <span className="rounded-full bg-surface-elevated/80 px-3 py-1 text-xs font-medium text-neutral-200">
                    {getViewerLabel(featuredStream.viewerCount)}
                  </span>
                </div>

                <h3 className="text-[38px] font-semibold leading-[1.12] tracking-[-0.03em] text-warm">
                  {featuredStream.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/live/${featuredStream.streamId}`)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/35 bg-accent/20 px-5 py-3 text-sm font-semibold text-accent-light transition hover:bg-accent/30"
              >
                <span>입장하기</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-surface p-3">
          <div className="custom-scrollbar flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
            {streams.map((stream) => {
              const isSelected = stream.streamId === featuredStream.streamId;

              return (
                <button
                  key={stream.streamId}
                  type="button"
                  onClick={() => setSelectedStreamId(stream.streamId)}
                  className={`flex items-center gap-3 rounded-[22px] border p-3 text-left transition ${
                    isSelected
                      ? 'border-primary/40 bg-primary-muted/45 shadow-[0_10px_24px_rgba(0,0,0,0.18)]'
                      : 'border-transparent bg-background/40 hover:bg-primary-muted/30'
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
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
