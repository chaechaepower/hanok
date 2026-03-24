import type { LiveCardData } from '@/types';

export type FollowingBannerProps = {
  streams: LiveCardData[];
};

export const getViewerLabel = (viewerCount: number) => `${viewerCount.toLocaleString()}명 시청 중`;
