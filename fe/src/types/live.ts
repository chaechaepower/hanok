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
  thumbnail: string | null;
  scheduledAt: string | null;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  status: string;
  notice: string | null;
  isLive: boolean;
  createdAt: string;
  items: LiveStreamItem[];
  seller: StreamEnterSeller;
  viewerCount: number;
  topBidders: StreamEnterTopBidder[];
  token: string;
  identity: string;
  isFollowing: boolean;
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
  description?: string;
  bidUnit?: number;
  auctionTime?: number;
  images?: string[];
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
  description?: string;
  bidUnit?: number;
  auctionTime?: number;
  images?: string[];
};

export type Live = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  scheduledAt: string | null;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  notice: string | null;
  isLive: boolean;
  createdAt: string;
  items: LiveStreamItem[];
};

export type StreamRequest = {
  title: string;
  category: string;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  scheduledAt?: string;
  notice?: string;
  itemIds: number[];
};

export type StreamMultipartPayload = {
  request: StreamRequest;
  thumbnail?: File;
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

export type BroadcastStreamEvent =
  | {
      eventType: 'AUCTION_START';
      payload?: {
        item?: {
          name?: string;
          condition?: string;
          bidUnit?: number;
          startPrice?: number;
        };
        timer?: StreamTimerPayload;
      };
    }
  | {
      eventType: 'BID_PLACED';
      payload?: {
        bidInfo?: {
          amount?: number;
        };
        snipingTimer?: StreamTimerPayload | null;
      };
    }
  | {
      eventType: 'BID_SYNC';
      payload?: BidSyncPayload | null;
    }
  | {
      eventType: 'AUCTION_STATISTICS';
      payload?: AuctionStatisticsPayload;
    }
  | {
      eventType: 'ITEM_SYNC';
      payload?: ItemSyncPayload | null;
    }
  | {
      eventType: 'ITEM_INTRODUCE';
      payload: null;
    }
  | {
      eventType: 'AUCTION_COMMENT';
      payload?: AuctionCommentPayload | null;
    }
  | {
      eventType: 'AUCTION_END';
      payload: null;
    }
  | {
      eventType: string;
      payload?: unknown;
    };

export type PrivateStreamEvent =
  | {
      eventType: 'BID_WINNER';
      payload?: BidWinnerPayload;
    }
  | {
      eventType: string;
      payload?: unknown;
    };
