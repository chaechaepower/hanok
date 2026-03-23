import type { MainStreamSort } from '@/api/hooks/useGetMain';
import type { LiveCardData, NewSellerRecommendedStream } from '@/types';

export const PAGE_SIZE = 10;
export const SCHEDULED_SECTION_SIZE = 12;
export const GRID_CLASS_NAME = 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5';

export const SORT_OPTIONS: Array<{ value: MainStreamSort; label: string }> = [
  { value: 'LATEST', label: '최신순' },
  { value: 'VIEWER_COUNT', label: '시청자순' },
];

export const getStreamOrderTime = (stream: Pick<LiveCardData, 'startedAt' | 'scheduledAt'>) =>
  Date.parse(stream.startedAt ?? stream.scheduledAt ?? '') || 0;

export const getScheduledOrderTime = (stream: Pick<LiveCardData, 'scheduledAt'>) =>
  Date.parse(stream.scheduledAt ?? '') || 0;

export const sortStreams = (streams: LiveCardData[], sortFilter: MainStreamSort) =>
  [...streams].sort((a, b) =>
    sortFilter === 'VIEWER_COUNT' ? b.viewerCount - a.viewerCount : getStreamOrderTime(b) - getStreamOrderTime(a),
  );

export const mapNewSellerStreamToLiveCard = (stream: NewSellerRecommendedStream): LiveCardData => ({
  streamId: stream.streamId,
  title: stream.title,
  category: stream.category,
  thumbnailUri: stream.thumbnailUri,
  streamStatus: stream.isLive ? 'LIVE' : 'SCHEDULED',
  viewerCount: stream.viewerCount,
  scheduledAt: stream.scheduledAt,
  startedAt: stream.startedAt,
  seller: stream.seller,
});
