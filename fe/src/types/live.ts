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
  topBidders: StreamEnterTopBidder[];
  token: string;
  identity: string;
  isFollowing: boolean;
  isHost: boolean;
};

export type SearchStreamStatus = 'LIVE' | 'SCHEDULED' | 'PAUSED' | 'ENDED';

export type LiveCardData = {
  streamId: number;
  title: string;
  category: string;
  thumbnailUri: string | null;
  streamStatus: SearchStreamStatus;
  viewerCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  seller: LiveSeller;
};

export type SearchMatchType = 'STREAM_TITLE' | 'ITEM_NAME' | 'TAG';

export type SearchMatchReason = {
  type: SearchMatchType;
  matchedValue: string;
};

export type SearchStreamResult = {
  streamId: number;
  title: string;
  thumbnail: string | null;
  category: string;
  status: SearchStreamStatus;
  viewerCount: number;
  scheduledAt: string | null;
  seller: LiveSeller;
  matchReasons: SearchMatchReason[];
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
  userId: number;
  nickname: string;
  amount: number;
  placedAt: string;
};

export type AuctionStatisticsPayload = {
  itemName: string;
  bidCount: number;
  startPrice: number;
  currentPrice: number;
  recentBids: AuctionStatisticsRecentBid[];
};

export type UniqueBidRange = {
  minPrice: number;
  maxPrice: number;
  bidUnit: number;
};

export type UniqueAuctionStatsPayload = {
  participantCount: number;
};

export type UniqueBidSyncPayload = {
  bidRange: UniqueBidRange;
  timer: StreamTimerPayload;
  participantCount: number;
  hasBid: boolean;
};

export type UniqueBidAckPayload = {
  amount: number;
};

export type UniqueAuctionEndDuplicate = {
  price: number;
  cnt: number;
};

export type UniqueAuctionEndPayload = {
  isWon: boolean;
  winnerPrice: number | null;
  topDuplicates: UniqueAuctionEndDuplicate[] | null;
};

export type StompErrorPayload = {
  code: string;
  message: string;
};

export type BidSyncPayload = {
  item: {
    bidUnit: number;
    currentPrice: number;
  };
  timer: StreamTimerPayload;
  isHighestBidder: boolean;
};

export type AuctionCommentPayload = {
  message: string;
};

export type ItemSyncAuctionStatus = 'READY' | 'INTRODUCING' | 'LIVE' | 'SOLD' | 'UNSOLD';

export type ItemSyncItemCondition = 'BRAND_NEW' | 'OPEN_BOX' | 'REFURBISHED' | 'USED';

export type LiveAuctionType = 'BOTTOM_UP' | 'UNIQUE_TOP';

export type ItemSyncItem = {
  auctionId: number;
  itemName: string;
  startPrice: number;
  auctionStatus: ItemSyncAuctionStatus;
  auctionType: LiveAuctionType;
  finalPrice: number | null;
  itemCondition: ItemSyncItemCondition;
  image?: string;
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
  auctionType?: LiveAuctionType;
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

export type EndStreamResponse = {
  streamId: number;
  status: 'ended';
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
      eventType: 'STREAM_PAUSED';
      payload: null;
    }
  | {
      eventType: 'STREAM_RESUMED';
      payload: null;
    }
  | {
      eventType: 'STREAM_FAILED';
      payload: null;
    }
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
      eventType: 'AUCTION_STATISTICS';
      payload?: AuctionStatisticsPayload;
    }
  | {
      eventType: 'UNIQUE_AUCTION_STATS';
      payload?: UniqueAuctionStatsPayload | null;
    }
  | {
      eventType: 'UNIQUE_AUCTION_START';
      payload?: {
        bidRange?: UniqueBidRange;
        timer?: StreamTimerPayload;
      };
    }
  | {
      eventType: 'UNIQUE_AUCTION_CALCULATING';
      payload: null;
    }
  | {
      eventType: 'UNIQUE_AUCTION_END';
      payload?: UniqueAuctionEndPayload;
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
      eventType?: string;
      event?: string;
      payload?: unknown;
    };

export type PrivateStreamEvent =
  | {
      eventType: 'BID_WINNER';
      payload?: BidWinnerPayload;
    }
  | {
      eventType: 'BID_SYNC';
      payload?: BidSyncPayload | null;
    }
  | {
      eventType: 'ITEM_SYNC';
      payload?: ItemSyncPayload | null;
    }
  | {
      eventType: 'UNIQUE_BID_SYNC';
      payload?: UniqueBidSyncPayload | null;
    }
  | {
      eventType: 'UNIQUE_BID_ACK';
      payload?: UniqueBidAckPayload;
    }
  | {
      eventType: string;
      payload?: unknown;
    };

export type ErrorStreamEvent =
  | {
      eventType: 'ERROR';
      payload?: StompErrorPayload;
    }
  | {
      eventType: string;
      payload?: unknown;
    };
