import type { ShippingAddressResponse } from './auction';

export type LiveSeller = {
  sellerId: number;
  nickname: string;
  profileImageUri: string | null;
};

export type StreamEnterSeller = {
  sellerId: number;
  nickname: string;
  profileImage: string | null;
  grade: string;
};

export type StreamEnterTopBidder = {
  rank: number;
  nickname: string;
  amount: number;
};

export type StreamEnterResponse = {
  streamId: number;
  title: string;
  category: string;
  status: string;
  notice: string | null;
  seller: StreamEnterSeller;
  viewerCount: number;
  topBidders: StreamEnterTopBidder[];
};

export type LiveCardData = {
  streamId: number;
  title: string;
  category: string;
  thumbnailUri: string | null;
  isLive: boolean;
  viewerCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  seller: LiveSeller;
};

export type AuctionDuration = 10 | 30 | 60;

export type TimerPhase = 'normal' | 'urgent' | 'ended';

export type StreamTimerPayload = {
  durationSeconds: number;
  serverNow: string;
  serverStartedAt: string;
};

export type SyncedAuctionTimer = StreamTimerPayload & {
  receivedAtMs: number;
};

export type BidWinnerPayload = {
  item: {
    itemName: string;
    finalPrice: number;
  };
  shipping: ShippingAddressResponse;
};

export type AuctionStatisticsRecentBid = {
  nickname: string;
  amount: number;
  placedAt: string;
};

export type AuctionStatisticsPayload = {
  itemName: string;
  totalPrice: number;
  bidCount: number;
  startPrice: number;
  currentPrice: number;
  recentBids: AuctionStatisticsRecentBid[];
};

export type BidSyncPayload = {
  item: {
    bidUnit: number;
    currentPrice: number;
  };
  timer: StreamTimerPayload;
};

export type AuctionCommentPayload = {
  message: string;
};

export type ItemSyncAuctionStatus = 'READY' | 'INTRODUCING' | 'LIVE' | 'SOLD' | 'UNSOLD';

export type ItemSyncItemCondition = 'BRAND_NEW' | 'OPEN_BOX' | 'REFURBISHED' | 'USED';

export type ItemSyncItem = {
  auctionId: number;
  itemName: string;
  image: string;
  startPrice: number;
  auctionStatus: ItemSyncAuctionStatus;
  finalPrice: number | null;
  itemCondition: ItemSyncItemCondition;
};

export type ItemSyncPayload = {
  items: ItemSyncItem[];
};

export type StreamState = 'live' | 'disconnected' | 'ended';

export type ChatMessageType =
  | { id: number; type: 'chat'; nickname: string; message: string }
  | { id: number; type: 'macro_request'; nickname: string; command: string }
  | { id: number; type: 'macro_response'; label: string; message: string }
  | { id: number; type: 'system'; message: string };

export type LiveStreamItemStatus = 'READY' | 'INTRODUCING' | 'LIVE' | 'SOLD' | 'UNSOLD';

export type LiveStreamItem = {
  itemId: number;
  name: string;
  category: string;
  startPrice: number;
  status: LiveStreamItemStatus;
  itemCondition: ItemSyncItemCondition;
  image1: string | null;
  createdAt: string;
};

export type Live = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  scheduledAt: string | null;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  notice?: string;
  isLive: boolean;
  createdAt: string;
  items: LiveStreamItem[];
};

export type StartStreamRequest = {
  title: string;
  category: string;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  scheduledAt?: string;
  notice?: string;
  itemIds: number[];
};

export type PostStreamResponse = {
  streamId: number;
  title: string;
  status: string;
};

export type RtcConfig = {
  iceServers: unknown[];
  sessionId: string;
};

export type StartStreamData = {
  status: 'live';
  rtcConfig: RtcConfig;
  openviduToken: string;
};

export type StartStreamResponse = {
  status: 'SUCCESS' | 'FAIL';
  message: string;
  data: StartStreamData;
};

export type UpdateStreamRequest = {
  title: string;
  category: string;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  scheduledAt?: string;
  notice?: string;
};

export type UpdateStreamResponse = {
  streamId: number;
  title: string;
  status: string;
};

export type DeleteStreamResponse = {
  streamId: number;
  status: 'cancelled';
};

export type ScheduledStream = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  scheduledAt: string | null;
  state: 'LIVE' | 'SCHEDULED';
};

export type ScheduledStreamsResponse = {
  streams: ScheduledStream[];
  hasNext: boolean;
};
