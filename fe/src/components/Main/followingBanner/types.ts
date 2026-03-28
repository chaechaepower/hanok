import type { LiveCardData } from '@/types';

export type FollowingBannerProps = {
  streams: LiveCardData[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
};

export const getViewerLabel = (viewerCount: number) => `${viewerCount.toLocaleString()}명 시청 중`;
