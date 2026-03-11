import type { ShippingAddressResponse } from './auction';

export type LiveSeller = {
  sellerId: number;
  nickname: string;
  profileImageUri: string | null;
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

export type StreamState = 'live' | 'disconnected' | 'ended';

export type ChatMessageType =
  | { id: number; type: 'chat'; nickname: string; message: string }
  | { id: number; type: 'macro_request'; nickname: string; command: string }
  | { id: number; type: 'macro_response'; label: string; message: string }
  | { id: number; type: 'system'; message: string };
