import type { ShippingAddressResponse } from './auction';
import type { ProductStatus } from './item';

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

export type StreamEnterResponse = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  scheduledAt: string | null;
  startType: 'SCHEDULED' | 'INSTANT';
  status: string;
  notice: string | null;
  isLive: boolean;
  createdAt: string;
  items: StreamEnterItem[];
  seller: StreamEnterSeller;
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

export type NewSellerRecommendedStream = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  status: SearchStreamStatus;
  viewerCount: number;
  startedAt: string | null;
  seller: LiveSeller;
};

export type NewSellerRecommendedStreamsResponse = NewSellerRecommendedStream[];

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
    myBidPrice?: number | null;
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
  count: number;
};

export type UniqueAuctionCalculatingPayload = {
  participantCount: number;
};

export type UniqueAuctionEndPayload = {
  isWon: boolean;
  winnerPrice: number | null;
  myBidPrice: number | null;
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

type ItemSyncItemBase = {
  auctionId: number;
  itemName: string;
  description: string;
  images: string[];
  auctionStatus: ItemSyncAuctionStatus;
  auctionTime: number;
  finalPrice: number | null;
  itemCondition: ItemSyncItemCondition;
};

export type ItemSyncItem =
  | (ItemSyncItemBase & {
      auctionType: 'BOTTOM_UP';
      bidUnit: number;
      startPrice: number;
      minPrice: null;
      maxPrice: null;
    })
  | (ItemSyncItemBase & {
      auctionType: 'UNIQUE_TOP';
      bidUnit: null;
      startPrice: null;
      minPrice: number;
      maxPrice: number;
    });

export type ItemSyncPayload = {
  items: ItemSyncItem[];
};

export type StreamState = 'live' | 'disconnected' | 'ended';

export type ChatMessageType =
  | { id: number; type: 'chat'; nickname: string; message: string }
  | { id: number; type: 'macro_request'; nickname: string; question: string; createdAt?: string }
  | { id: number; type: 'macro_response'; sender: string; question: string; answer: string; createdAt?: string }
  | { id: number; type: 'system'; message: string };

export type LiveStreamItemStatus = 'READY' | 'INTRODUCING' | 'LIVE' | 'SOLD' | 'UNSOLD';

export type StreamEnterItem = {
  itemId: number;
  name: string;
  category: string;
  startPrice: number;
  minPrice?: number | null;
  maxPrice?: number | null;
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

export type StreamDetailItem =
  | {
      itemId: number;
      name: string;
      description: string;
      tags: string[];
      images: string[];
      auctionType: 'BOTTOM_UP';
      auctionDuration: number;
      bottomUp: {
        startPrice: number;
        bidUnit: number;
      };
      uniqueTop: null;
      itemCondition: ItemSyncItemCondition;
      category: string;
      status: ProductStatus;
      createdAt: string;
    }
  | {
      itemId: number;
      name: string;
      description: string;
      tags: string[];
      images: string[];
      auctionType: 'UNIQUE_TOP';
      auctionDuration: number;
      bottomUp: null;
      uniqueTop: {
        minPrice: number;
        maxPrice: number;
      };
      itemCondition: ItemSyncItemCondition;
      category: string;
      status: ProductStatus;
      createdAt: string;
    };

export type StreamDetailResponse = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  scheduledAt: string | null;
  startType: 'SCHEDULED' | 'INSTANT';
  notice: string | null;
  isLive: boolean;
  createdAt: string;
  items: StreamDetailItem[];
};

export type StreamRequest = {
  title: string;
  category: string;
  startType: 'SCHEDULED' | 'INSTANT';
  scheduledAt?: string;
  notice?: string;
  auctionItems: StreamAuctionItem[];
};

export type StreamAuctionItem =
  | {
      itemId: number;
      auctionType: 'BOTTOM_UP';
      auctionDuration: number;
      bottomUp: {
        startPrice: number;
        bidUnit: number;
      };
      uniqueTop: null;
    }
  | {
      itemId: number;
      auctionType: 'UNIQUE_TOP';
      auctionDuration: number;
      bottomUp: null;
      uniqueTop: {
        minPrice: number;
        maxPrice: number;
      };
    };

export type StreamMultipartPayload = {
  request: StreamRequest;
  thumbnail?: File;
};

export type PostStreamResponse = {
  streamId: number;
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
      payload?: UniqueAuctionCalculatingPayload | null;
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
      eventType: 'SYSTEM_STREAM_END';
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
      eventType: 'UNIQUE_AUCTION_END';
      payload?: UniqueAuctionEndPayload;
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
