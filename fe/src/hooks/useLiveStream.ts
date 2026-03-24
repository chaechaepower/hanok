import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AuctionStatisticsPayload,
  BidSyncPayload,
  BidWinnerPayload,
  BroadcastStreamEvent,
  ErrorStreamEvent,
  ItemSyncItem,
  ItemSyncPayload,
  PrivateStreamEvent,
  StompErrorPayload,
  StreamState,
  StreamTimerPayload,
  SyncedAuctionTimer,
  UniqueAuctionEndPayload,
  UniqueBidSyncPayload,
} from '@/types';
import { sendStreamMessage, subscribeStream } from '@/websocket/stompClient';
import { useToast } from './useToast';

// ---------------------------------------------------------------------------
// Private type guards
// ---------------------------------------------------------------------------

const isAuctionStartEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'AUCTION_START' }> => event.eventType === 'AUCTION_START';

const isBidPlacedEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'BID_PLACED' }> => event.eventType === 'BID_PLACED';

const isAuctionStatisticsEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'AUCTION_STATISTICS' }> =>
  event.eventType === 'AUCTION_STATISTICS';

const isAuctionCommentEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'AUCTION_COMMENT' }> => event.eventType === 'AUCTION_COMMENT';

const isAuctionItemIntroduceEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'ITEM_INTRODUCE' }> => event.eventType === 'ITEM_INTRODUCE';

const isBidEndEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'AUCTION_END' }> => event.eventType === 'AUCTION_END';

const isUniqueAuctionStartEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'UNIQUE_AUCTION_START' }> =>
  event.eventType === 'UNIQUE_AUCTION_START';

const isUniqueAuctionStatsEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'UNIQUE_AUCTION_STATS' }> =>
  event.eventType === 'UNIQUE_AUCTION_STATS';

const isUniqueAuctionCalculatingEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'UNIQUE_AUCTION_CALCULATING' }> =>
  event.eventType === 'UNIQUE_AUCTION_CALCULATING';

const isUniqueAuctionEndEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'UNIQUE_AUCTION_END' }> =>
  event.eventType === 'UNIQUE_AUCTION_END';

const isStreamPausedEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'STREAM_PAUSED' }> =>
  event.eventType === 'STREAM_PAUSED' || ('event' in event && event.event === 'stream:paused');

const isStreamResumedEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'STREAM_RESUMED' }> =>
  event.eventType === 'STREAM_RESUMED' || ('event' in event && event.event === 'stream:resumed');

const isStreamFailedEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'STREAM_FAILED' }> =>
  event.eventType === 'STREAM_FAILED' || ('event' in event && event.event === 'stream:failed');

const isSystemStreamEndEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'SYSTEM_STREAM_END' }> =>
  event.eventType === 'SYSTEM_STREAM_END';

const isBidWinnerEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'BID_WINNER' }> => event.eventType === 'BID_WINNER';

const isPrivateBidSyncEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'BID_SYNC' }> => event.eventType === 'BID_SYNC';

const isPrivateItemSyncEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'ITEM_SYNC' }> => event.eventType === 'ITEM_SYNC';

const isUniqueBidAckEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'UNIQUE_BID_ACK' }> => event.eventType === 'UNIQUE_BID_ACK';

const isUniqueBidSyncEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'UNIQUE_BID_SYNC' }> => event.eventType === 'UNIQUE_BID_SYNC';

const isStompErrorEvent = (event: ErrorStreamEvent): event is Extract<ErrorStreamEvent, { eventType: 'ERROR' }> =>
  event.eventType === 'ERROR';

const isUniqueAlreadyBidError = (payload?: StompErrorPayload) => payload?.code === 'UNIQUE-003';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const TIMER_SNAPSHOT_TOLERANCE_MS = 1000;
const UNIQUE_WINNER_RESOLVE_DELAY_MS = 250;

type WinnerInfoState = {
  payload: BidWinnerPayload;
  itemCond: ItemSyncItem['itemCondition'] | '';
};

type UniqueAuctionResultState = {
  itemName: string;
  payload: UniqueAuctionEndPayload;
  winnerInfo: WinnerInfoState | null;
};

const createSyncedTimer = (timer: StreamTimerPayload): SyncedAuctionTimer => {
  const serverNowMs = Date.parse(timer.serverNow);
  const serverStartedAtMs = Date.parse(timer.serverStartedAt);
  const isRemainingSnapshot =
    !Number.isNaN(serverNowMs) &&
    !Number.isNaN(serverStartedAtMs) &&
    serverNowMs - serverStartedAtMs > timer.durationSeconds * 1000 + TIMER_SNAPSHOT_TOLERANCE_MS;

  return {
    ...timer,
    // Some BID_SYNC payloads send "remaining duration" with the original auction start time.
    // Re-anchor those snapshots to serverNow so the local countdown does not jump straight to ended.
    serverStartedAt: isRemainingSnapshot ? timer.serverNow : timer.serverStartedAt,
    receivedAtMs: Date.now(),
  };
};

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export type UseLiveStreamReturn = {
  // state
  isStreamLive: boolean;
  liveStartedAt: string | null;
  timer: SyncedAuctionTimer | null;
  bidSync: BidSyncPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  itemSync: ItemSyncPayload | null;
  streamState: StreamState;
  auctionStatistics: AuctionStatisticsPayload | null;
  auctionComment: { id: number; message: string } | null;
  winnerInfo: WinnerInfoState | null;
  uniqueAuctionResult: UniqueAuctionResultState | null;
  liveAuctionItem: ItemSyncItem | null;
  introducingAuctionItem: ItemSyncItem | null;
  // actions
  confirmStreamStart: () => void;
  markStreamEnded: () => void;
  clearWinnerInfo: () => void;
  clearUniqueAuctionResult: () => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveStream(streamId: string | undefined, isLiveFromServer: boolean): UseLiveStreamReturn {
  const { showToast } = useToast();

  const [liveStateOverride, setLiveStateOverride] = useState<boolean | null>(null);
  const [liveStartedAt, setLiveStartedAt] = useState<string | null>(null);
  const [timer, setTimer] = useState<SyncedAuctionTimer | null>(null);
  const [bidSync, setBidSync] = useState<BidSyncPayload | null>(null);
  const [uniqueBidSync, setUniqueBidSync] = useState<UniqueBidSyncPayload | null>(null);
  const [itemSync, setItemSync] = useState<ItemSyncPayload | null>(null);
  const [streamState, setStreamState] = useState<StreamState>('live');
  const [auctionStatistics, setAuctionStatistics] = useState<AuctionStatisticsPayload | null>(null);
  const [auctionComment, setAuctionComment] = useState<{ id: number; message: string } | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<WinnerInfoState | null>(null);
  const [uniqueAuctionResult, setUniqueAuctionResult] = useState<UniqueAuctionResultState | null>(null);

  const lastActiveItemRef = useRef<ItemSyncItem | null>(null);
  const uniqueAuctionResultDismissedRef = useRef(true);
  const snipingTimerSetAtRef = useRef<number>(0);
  const pendingAmbiguousUniqueEndRef = useRef<UniqueAuctionEndPayload | null>(null);
  const pendingUniqueWinnerInfoRef = useRef<WinnerInfoState | null>(null);
  const uniqueWinnerResolveTimeoutRef = useRef<number | null>(null);
  // Ref that is set once the STOMP subscription is established.
  // Used to gate ITEM_SYNC calls on subscription readiness (race condition fix).
  const requestItemSyncRef = useRef<(() => Promise<void>) | null>(null);

  const isStreamLive = liveStateOverride ?? isLiveFromServer;

  // Derived values
  const introducingAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'INTRODUCING') ?? null;
  const liveAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'LIVE') ?? null;

  // ---------------------------------------------------------------------------
  // auctionComment auto-clear
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!auctionComment) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAuctionComment(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [auctionComment]);

  // ---------------------------------------------------------------------------
  // Track last active item (used for winner / unique auction result labels)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const nextActiveItem = liveAuctionItem ?? introducingAuctionItem;

    if (nextActiveItem) {
      lastActiveItemRef.current = nextActiveItem;
    }
  }, [introducingAuctionItem, liveAuctionItem]);

  // ---------------------------------------------------------------------------
  // BID_SYNC effect: re-request bid state only after the auction is live
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const activeBidAuctionId = liveAuctionItem?.auctionId ?? null;
    const activeAuctionType = liveAuctionItem?.auctionType ?? null;

    if (!streamId || activeBidAuctionId === null || !activeAuctionType) {
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: activeAuctionType === 'UNIQUE_TOP' ? 'UNIQUE_BID_SYNC' : 'BID_SYNC',
      payload: null,
    }).catch((error) => {
      console.error('[stream] failed to sync active auction state', error);
    });
  }, [liveAuctionItem, streamId]);

  // ---------------------------------------------------------------------------
  // Main STOMP subscription effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!streamId) {
      return;
    }

    const requestItemSync = async () => {
      console.log('[stream] requesting ITEM_SYNC for streamId:', streamId);
      await sendStreamMessage(streamId, {
        eventType: 'ITEM_SYNC',
        payload: null,
      });
    };

    const requestActiveAuctionSync = async (item: ItemSyncItem | null) => {
      if (!item || item.auctionStatus !== 'LIVE') {
        return;
      }

      await sendStreamMessage(streamId, {
        eventType: item.auctionType === 'UNIQUE_TOP' ? 'UNIQUE_BID_SYNC' : 'BID_SYNC',
        payload: null,
      });
    };

    const requestBidSync = async () => {
      await sendStreamMessage(streamId, {
        eventType: 'BID_SYNC',
        payload: null,
      });
    };

    const applyBidSync = (payload?: BidSyncPayload | null) => {
      setBidSync(payload ?? null);
      const snipingAge = Date.now() - snipingTimerSetAtRef.current;
      if (payload?.timer && snipingAge > 2000) {
        setTimer(createSyncedTimer(payload.timer));
      }
    };

    const applyItemSync = (payload?: ItemSyncPayload | null) => {
      setItemSync(payload ?? null);
      const nextActiveItem = payload?.items.find((item) => item.auctionStatus === 'LIVE') ?? null;
      if (nextActiveItem?.auctionType === 'UNIQUE_TOP') {
        uniqueAuctionResultDismissedRef.current = false;
      }
      void requestActiveAuctionSync(nextActiveItem);
    };

    const clearPendingUniqueWinnerResolution = () => {
      pendingAmbiguousUniqueEndRef.current = null;
      pendingUniqueWinnerInfoRef.current = null;

      if (uniqueWinnerResolveTimeoutRef.current !== null) {
        window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
        uniqueWinnerResolveTimeoutRef.current = null;
      }
    };

    const applyUniqueAuctionResult = (payload: UniqueAuctionEndPayload, nextWinnerInfo: WinnerInfoState | null = null) => {
      uniqueAuctionResultDismissedRef.current = false;
      setUniqueAuctionResult((prev) => ({
        itemName: lastActiveItemRef.current?.itemName ?? prev?.itemName ?? 'Auction item',
        payload: {
          ...payload,
          myBidPrice: payload.myBidPrice ?? prev?.payload.myBidPrice ?? null,
        },
        winnerInfo: nextWinnerInfo,
      }));
    };

    const tryFinalizeUniqueWinnerResult = () => {
      const pendingWinnerEnd = pendingAmbiguousUniqueEndRef.current;
      const pendingWinnerInfo = pendingUniqueWinnerInfoRef.current;

      if (!pendingWinnerEnd || !pendingWinnerInfo) {
        return;
      }

      applyUniqueAuctionResult(
        {
          ...pendingWinnerEnd,
          myBidPrice: pendingWinnerEnd.myBidPrice ?? pendingWinnerInfo.payload.item.myBidPrice ?? pendingWinnerEnd.winnerPrice,
        },
        pendingWinnerInfo,
      );
      setWinnerInfo(null);
      clearPendingUniqueWinnerResolution();
    };

    const handleBroadcastEvent = (event: BroadcastStreamEvent) => {
      console.log('[stream] broadcast event:', event);
      if (isAuctionStartEvent(event) && event.payload?.timer) {
        clearPendingUniqueWinnerResolution();
        uniqueAuctionResultDismissedRef.current = true;
        setStreamState('live');
        setTimer(createSyncedTimer(event.payload.timer));
        setUniqueBidSync(null);
        setUniqueAuctionResult(null);
        if (typeof event.payload.item?.startPrice === 'number' && typeof event.payload.item?.bidUnit === 'number') {
          setBidSync({
            item: {
              bidUnit: event.payload.item.bidUnit,
              currentPrice: event.payload.item.startPrice,
            },
            timer: event.payload.timer,
            isHighestBidder: false,
          });
        }
        setWinnerInfo(null);
        void requestItemSync();
        return;
      }

      if (isUniqueAuctionStartEvent(event) && event.payload?.bidRange && event.payload?.timer) {
        clearPendingUniqueWinnerResolution();
        uniqueAuctionResultDismissedRef.current = false;
        setStreamState('live');
        setBidSync(null);
        setAuctionStatistics(null);
        setUniqueAuctionResult(null);
        setWinnerInfo(null);
        setTimer(createSyncedTimer(event.payload.timer));
        setUniqueBidSync({
          bidRange: event.payload.bidRange,
          timer: event.payload.timer,
          participantCount: 0,
          hasBid: false,
        });
        void requestItemSync();
        return;
      }

      if (isBidPlacedEvent(event)) {
        if (event.payload?.snipingTimer) {
          snipingTimerSetAtRef.current = Date.now();
          setTimer(createSyncedTimer(event.payload.snipingTimer));
        }

        if (typeof event.payload?.bidInfo?.amount === 'number') {
          setBidSync((prev) =>
            prev
              ? {
                  ...prev,
                  item: {
                    ...prev.item,
                    currentPrice: event.payload?.bidInfo?.amount ?? prev.item.currentPrice,
                  },
                }
              : prev,
          );
        }

        void requestBidSync();
        return;
      }

      if (isStreamPausedEvent(event)) {
        setStreamState('disconnected');
        setTimer(null);
        return;
      }

      if (isStreamResumedEvent(event)) {
        setStreamState('live');
        void requestItemSync();
        return;
      }

      if (isStreamFailedEvent(event)) {
        setStreamState('ended');
        setLiveStateOverride(false);
        setTimer(null);
        return;
      }

      if (isSystemStreamEndEvent(event)) {
        clearPendingUniqueWinnerResolution();
        uniqueAuctionResultDismissedRef.current = true;
        setStreamState('ended');
        setLiveStateOverride(false);
        setTimer(null);
        setBidSync(null);
        setUniqueBidSync(null);
        return;
      }

      if (isAuctionCommentEvent(event) && event.payload?.message) {
        setAuctionComment({
          id: Date.now(),
          message: event.payload.message,
        });
        return;
      }

      if (isAuctionItemIntroduceEvent(event)) {
        void requestItemSync();
        return;
      }

      if (isUniqueAuctionCalculatingEvent(event)) {
        setUniqueBidSync((prev) =>
          prev
            ? {
                ...prev,
                participantCount: event.payload?.participantCount ?? prev.participantCount,
              }
            : prev,
        );
        return;
      }

      if (isUniqueAuctionEndEvent(event) && event.payload) {
        setTimer(null);
        setUniqueBidSync(null);
        if (event.payload.isWon && event.payload.myBidPrice === null) {
          pendingAmbiguousUniqueEndRef.current = event.payload;

          if (pendingUniqueWinnerInfoRef.current) {
            tryFinalizeUniqueWinnerResult();
            void requestItemSync();
            return;
          }

          if (uniqueWinnerResolveTimeoutRef.current !== null) {
            window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
          }

          uniqueWinnerResolveTimeoutRef.current = window.setTimeout(() => {
            const pendingPayload = pendingAmbiguousUniqueEndRef.current;

            if (pendingPayload) {
              applyUniqueAuctionResult(pendingPayload);
            }

            clearPendingUniqueWinnerResolution();
          }, UNIQUE_WINNER_RESOLVE_DELAY_MS);
        } else {
          clearPendingUniqueWinnerResolution();
          applyUniqueAuctionResult(event.payload);
        }

        void requestItemSync();
        return;
      }

      if (isBidEndEvent(event)) {
        setBidSync(null);
        void requestItemSync();
        return;
      }

      if (isAuctionStatisticsEvent(event) && event.payload) {
        setAuctionStatistics(event.payload);
        return;
      }

      if (isUniqueAuctionStatsEvent(event) && event.payload) {
        setUniqueBidSync((prev) =>
          prev
            ? {
                ...prev,
                participantCount: event.payload?.participantCount ?? prev.participantCount,
              }
            : prev,
        );
        return;
      }

      if ((event as { eventType?: string }).eventType === 'SYSTEM_STREAM_START') {
        setLiveStateOverride(true);
        setLiveStartedAt((prev) => prev ?? new Date().toISOString());
        void requestItemSync();
        return;
      }
    };

    const handlePrivateEvent = (event: PrivateStreamEvent) => {
      if (isPrivateBidSyncEvent(event)) {
        applyBidSync(event.payload);
        return;
      }

      if (isPrivateItemSyncEvent(event)) {
        applyItemSync(event.payload);
        return;
      }

      if (isUniqueBidSyncEvent(event)) {
        uniqueAuctionResultDismissedRef.current = false;
        setUniqueBidSync(event.payload ?? null);
        if (event.payload?.timer) {
          setTimer(createSyncedTimer(event.payload.timer));
        }
        return;
      }

      if (isBidWinnerEvent(event) && event.payload) {
        const payload = event.payload;
        const nextWinnerInfo: WinnerInfoState = {
          payload,
          itemCond: lastActiveItemRef.current?.itemCondition ?? '',
        };
        const isUniqueWinnerEvent = payload.item.myBidPrice !== undefined;

        if (isUniqueWinnerEvent) {
          pendingUniqueWinnerInfoRef.current = nextWinnerInfo;
          tryFinalizeUniqueWinnerResult();
          return;
        }

        setWinnerInfo(nextWinnerInfo);
        return;
      }

      if (isUniqueBidAckEvent(event) && event.payload) {
        setUniqueBidSync((prev) => (prev ? { ...prev, hasBid: true } : prev));
        showToast({ message: `${event.payload.amount.toLocaleString()}원 입찰이 접수되었습니다.` });
        return;
      }

    };

    const handleErrorEvent = (event: ErrorStreamEvent) => {
      if (!isStompErrorEvent(event) || !event.payload) {
        return;
      }

      if (isUniqueAlreadyBidError(event.payload)) {
        setUniqueBidSync((prev) => (prev ? { ...prev, hasBid: true } : prev));
      }

      showToast({ message: event.payload.message });
    };

    let isDisposed = false;
    let unsubscribeStream: () => void = () => {};

    void subscribeStream<BroadcastStreamEvent, PrivateStreamEvent, ErrorStreamEvent>({
      streamId,
      onBroadcast: handleBroadcastEvent,
      onPrivate: handlePrivateEvent,
      onError: handleErrorEvent,
    })
      .then(async (cleanup) => {
        if (isDisposed) {
          cleanup();
          return;
        }

        unsubscribeStream = cleanup;
        console.log('[stream] STOMP subscribed successfully for streamId:', streamId);
        // Mark subscription as ready so the isStreamLive effect can safely call ITEM_SYNC.
        requestItemSyncRef.current = requestItemSync;
        await requestItemSync();
      })
      .catch((error) => {
        console.error('[stream] failed to subscribe', error);
      });

    return () => {
      isDisposed = true;
      requestItemSyncRef.current = null;

      if (uniqueWinnerResolveTimeoutRef.current !== null) {
        window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
        uniqueWinnerResolveTimeoutRef.current = null;
      }

      unsubscribeStream();
    };
  }, [showToast, streamId]);

  // ---------------------------------------------------------------------------
  // Race-condition-safe ITEM_SYNC on stream live transition.
  // Uses the ref so the call is only made once the subscription is ready.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isStreamLive) return;
    void requestItemSyncRef.current?.();
  }, [isStreamLive]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const confirmStreamStart = useCallback(() => {
    setLiveStateOverride(true);
    setLiveStartedAt((prev) => prev ?? new Date().toISOString());
    void requestItemSyncRef.current?.();
  }, []);

  const markStreamEnded = useCallback(() => {
    setStreamState('ended');
  }, []);

  const clearWinnerInfo = useCallback(() => {
    setWinnerInfo(null);
  }, []);

  const clearUniqueAuctionResult = useCallback(() => {
    uniqueAuctionResultDismissedRef.current = true;

    pendingAmbiguousUniqueEndRef.current = null;
    pendingUniqueWinnerInfoRef.current = null;

    if (uniqueWinnerResolveTimeoutRef.current !== null) {
      window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
      uniqueWinnerResolveTimeoutRef.current = null;
    }

    setUniqueAuctionResult(null);
  }, []);

  return {
    isStreamLive,
    liveStartedAt,
    timer,
    bidSync,
    uniqueBidSync,
    itemSync,
    streamState,
    auctionStatistics,
    auctionComment,
    winnerInfo,
    uniqueAuctionResult,
    liveAuctionItem,
    introducingAuctionItem,
    confirmStreamStart,
    markStreamEnded,
    clearWinnerInfo,
    clearUniqueAuctionResult,
  };
}
