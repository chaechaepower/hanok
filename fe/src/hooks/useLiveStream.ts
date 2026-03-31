import { useCallback, useEffect, useRef, useState } from 'react';
import type { SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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
import { createLiveHotStateStore } from '../store/liveHotStateStore';
import type { LiveHotStateStore } from '../store/liveHotStateStore';
import { clearPendingWalletInvalidationForBid, consumePendingWalletInvalidationForBid } from './useBidState';
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

const isUniqueAuctionEndPublicEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'UNIQUE_AUCTION_END_PUBLIC' }> =>
  event.eventType === 'UNIQUE_AUCTION_END_PUBLIC';

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

const isPrivateAuctionStatisticsSyncEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'AUCTION_STATISTICS_SYNC' }> =>
  event.eventType === 'AUCTION_STATISTICS_SYNC';

const isUniqueBidAckEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'UNIQUE_BID_ACK' }> => event.eventType === 'UNIQUE_BID_ACK';

const isUniqueBidSyncEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'UNIQUE_BID_SYNC' }> => event.eventType === 'UNIQUE_BID_SYNC';

const isPrivateUniqueAuctionEndEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'UNIQUE_AUCTION_END' }> =>
  event.eventType === 'UNIQUE_AUCTION_END';

const isStompErrorEvent = (event: ErrorStreamEvent): event is Extract<ErrorStreamEvent, { eventType: 'ERROR' }> =>
  event.eventType === 'ERROR';

const isUniqueAlreadyBidError = (payload?: StompErrorPayload) => payload?.code === 'UNIQUE-003';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const TIMER_SNAPSHOT_TOLERANCE_MS = 1000;
const UNIQUE_WINNER_RESOLVE_DELAY_MS = 250;

type SyncRequestSource =
  | 'INITIAL_SUBSCRIBE'
  | 'STREAM_LIVE_EFFECT'
  | 'ACTIVE_AUCTION_EFFECT'
  | 'AUCTION_START'
  | 'UNIQUE_AUCTION_START'
  | 'STREAM_RESUMED'
  | 'ITEM_INTRODUCE'
  | 'BID_END'
  | 'UNIQUE_AUCTION_END'
  | 'SYSTEM_STREAM_START'
  | 'CONFIRM_STREAM_START'
  | 'UNKNOWN';
type SyncRequestInvoker = (source?: SyncRequestSource) => Promise<void>;

const shouldRecoverActiveAuctionSync = (source: SyncRequestSource) =>
  source === 'INITIAL_SUBSCRIBE' ||
  source === 'STREAM_LIVE_EFFECT' ||
  source === 'STREAM_RESUMED' ||
  source === 'CONFIRM_STREAM_START' ||
  source === 'SYSTEM_STREAM_START';

const shouldRecoverAuctionStatisticsSync = (source: SyncRequestSource) => shouldRecoverActiveAuctionSync(source);

type SyncedTimerMode = 'auto' | 'remainingSnapshot';

export type WinnerInfoState = {
  payload: BidWinnerPayload;
  itemCond: ItemSyncItem['itemCondition'] | '';
};

export type UniqueAuctionResultState = {
  itemName: string;
  payload: UniqueAuctionEndPayload;
  winnerInfo: WinnerInfoState | null;
};

const createSyncedTimer = (timer: StreamTimerPayload, mode: SyncedTimerMode = 'auto'): SyncedAuctionTimer => {
  const serverNowMs = Date.parse(timer.serverNow);
  const serverStartedAtMs = Date.parse(timer.serverStartedAt);
  const isRemainingSnapshot =
    mode === 'remainingSnapshot' ||
    (!Number.isNaN(serverNowMs) &&
      !Number.isNaN(serverStartedAtMs) &&
      serverNowMs - serverStartedAtMs > timer.durationSeconds * 1000 + TIMER_SNAPSHOT_TOLERANCE_MS);

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
  hotStateStore: LiveHotStateStore;
  itemSync: ItemSyncPayload | null;
  streamState: StreamState;
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

export function useLiveStream(
  streamId: string | undefined,
  isLiveFromServer: boolean,
  initialStreamStatus?: string | null,
): UseLiveStreamReturn {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));

  const [liveStateOverride, setLiveStateOverride] = useState<boolean | null>(null);
  const [liveStartedAt, setLiveStartedAt] = useState<string | null>(null);
  const [itemSync, setItemSync] = useState<ItemSyncPayload | null>(null);
  const [runtimeStreamState, setRuntimeStreamState] = useState<{
    streamId: string | undefined;
    value: StreamState | null;
  }>({
    streamId,
    value: null,
  });
  const [winnerInfo, setWinnerInfo] = useState<WinnerInfoState | null>(null);
  const [uniqueAuctionResult, setUniqueAuctionResult] = useState<UniqueAuctionResultState | null>(null);
  const [hotStateStore] = useState<LiveHotStateStore>(() => createLiveHotStateStore());
  const auctionCommentTimeoutRef = useRef<number | null>(null);

  const lastActiveItemRef = useRef<ItemSyncItem | null>(null);
  const uniqueAuctionResultDismissedRef = useRef(true);
  const snipingTimerSetAtRef = useRef<number>(0);
  const pendingAmbiguousUniqueEndRef = useRef<UniqueAuctionEndPayload | null>(null);
  const uniqueWinnerResolveTimeoutRef = useRef<number | null>(null);
  const ignoreWonUniqueEndRef = useRef(false);
  const pendingItemSyncSourceRef = useRef<SyncRequestSource>('UNKNOWN');
  // Ref that is set once the STOMP subscription is established.
  // Used to gate ITEM_SYNC calls on subscription readiness (race condition fix).
  const requestItemSyncRef = useRef<SyncRequestInvoker | null>(null);
  const requestBidSyncRef = useRef<SyncRequestInvoker | null>(null);
  const requestAuctionStatisticsSyncRef = useRef<SyncRequestInvoker | null>(null);
  const requestUniqueBidSyncRef = useRef<SyncRequestInvoker | null>(null);

  const isStreamLive = liveStateOverride ?? isLiveFromServer;
  const serverStreamState: StreamState = initialStreamStatus === 'PAUSED' ? 'disconnected' : 'live';
  const streamState =
    runtimeStreamState.streamId === streamId && runtimeStreamState.value !== null
      ? runtimeStreamState.value
      : serverStreamState;

  const setStreamState = useCallback(
    (value: SetStateAction<StreamState>) => {
      setRuntimeStreamState((prev) => {
        const prevValue = prev.streamId === streamId && prev.value !== null ? prev.value : serverStreamState;
        const nextValue = typeof value === 'function' ? value(prevValue) : value;

        if (prev.streamId === streamId && prev.value === nextValue) {
          return prev;
        }

        return {
          streamId,
          value: nextValue,
        };
      });
    },
    [serverStreamState, streamId],
  );

  // Derived values
  const introducingAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'INTRODUCING') ?? null;
  const liveAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'LIVE') ?? null;

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
  // Active auction sync effect: re-request live auction state after reconnect / re-entry
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const activeBidAuctionId = liveAuctionItem?.auctionId ?? null;
    const activeAuctionType = liveAuctionItem?.auctionType ?? null;

    if (!streamId || activeBidAuctionId === null || !activeAuctionType) {
      return;
    }

    const syncPromise =
      activeAuctionType === 'UNIQUE_TOP'
        ? requestUniqueBidSyncRef.current?.('ACTIVE_AUCTION_EFFECT')
        : requestBidSyncRef.current?.('ACTIVE_AUCTION_EFFECT');

    void Promise.resolve(syncPromise).catch((error) => {
      console.error('[stream] failed to sync active auction state', error);
    });
  }, [streamId, liveAuctionItem?.auctionId, liveAuctionItem?.auctionType]);

  // ---------------------------------------------------------------------------
  // Main STOMP subscription effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    hotStateStore.reset();

    if (auctionCommentTimeoutRef.current !== null) {
      window.clearTimeout(auctionCommentTimeoutRef.current);
      auctionCommentTimeoutRef.current = null;
    }
  }, [hotStateStore, streamId]);

  useEffect(() => {
    if (!streamId) {
      return;
    }

    const requestItemSync: SyncRequestInvoker = async (source = 'UNKNOWN') => {
      pendingItemSyncSourceRef.current = source;
      await sendStreamMessage(streamId, {
        eventType: 'ITEM_SYNC',
        payload: null,
      });
    };

    const requestBidSync: SyncRequestInvoker = async (source = 'UNKNOWN') => {
      void source;
      await sendStreamMessage(streamId, {
        eventType: 'BID_SYNC',
        payload: null,
      });
    };

    const requestAuctionStatisticsSync: SyncRequestInvoker = async (source = 'UNKNOWN') => {
      void source;
      await sendStreamMessage(streamId, {
        eventType: 'AUCTION_STATISTICS_SYNC',
        payload: null,
      });
    };

    const requestUniqueBidSync: SyncRequestInvoker = async (source = 'UNKNOWN') => {
      void source;
      await sendStreamMessage(streamId, {
        eventType: 'UNIQUE_BID_SYNC',
        payload: null,
      });
    };

    requestItemSyncRef.current = requestItemSync;
    requestBidSyncRef.current = requestBidSync;
    requestAuctionStatisticsSyncRef.current = requestAuctionStatisticsSync;
    requestUniqueBidSyncRef.current = requestUniqueBidSync;

    const requestActiveAuctionSync = async (item: ItemSyncItem | null, source: SyncRequestSource = 'UNKNOWN') => {
      if (!item || item.auctionStatus !== 'LIVE') {
        return;
      }

      if (!shouldRecoverActiveAuctionSync(source)) {
        return;
      }

      if (item.auctionType === 'UNIQUE_TOP') {
        await requestUniqueBidSync(source);
        return;
      }

      if (shouldRecoverAuctionStatisticsSync(source)) {
        await Promise.all([requestBidSync(source), requestAuctionStatisticsSync(source)]);
        return;
      }

      await requestBidSync(source);
    };

    const setTimerState = (value: SetStateAction<SyncedAuctionTimer | null>) => hotStateStore.setTimer(value);
    const setBidSyncState = (value: SetStateAction<BidSyncPayload | null>) => hotStateStore.setBidSync(value);
    const setAuctionStatisticsState = (value: SetStateAction<AuctionStatisticsPayload | null>) =>
      hotStateStore.setAuctionStatistics(value);
    const setUniqueBidSyncState = (value: SetStateAction<UniqueBidSyncPayload | null>) =>
      hotStateStore.setUniqueBidSync(value);
    const setAuctionCommentState = (value: SetStateAction<{ id: number; message: string } | null>) => {
      const next = hotStateStore.setAuctionComment(value);

      if (auctionCommentTimeoutRef.current !== null) {
        window.clearTimeout(auctionCommentTimeoutRef.current);
        auctionCommentTimeoutRef.current = null;
      }

      if (next) {
        auctionCommentTimeoutRef.current = window.setTimeout(() => {
          hotStateStore.setAuctionComment(null);
          auctionCommentTimeoutRef.current = null;
        }, 2400);
      }

      return next;
    };

    const applyBidSync = (payload?: BidSyncPayload | null) => {
      setBidSyncState(payload ?? null);
      const snipingAge = Date.now() - snipingTimerSetAtRef.current;
      if (payload?.timer && snipingAge > 2000) {
        setTimerState(createSyncedTimer(payload.timer, 'remainingSnapshot'));
      }
    };

    const applyItemSync = (payload?: ItemSyncPayload | null, source: SyncRequestSource = 'UNKNOWN') => {
      setItemSync(payload ?? null);
      const nextActiveItem = payload?.items.find((item) => item.auctionStatus === 'LIVE') ?? null;
      if (nextActiveItem?.auctionType === 'UNIQUE_TOP') {
        uniqueAuctionResultDismissedRef.current = false;
      }
      void requestActiveAuctionSync(nextActiveItem, source);
    };

    const clearPendingUniqueWinnerResolution = () => {
      pendingAmbiguousUniqueEndRef.current = null;

      if (uniqueWinnerResolveTimeoutRef.current !== null) {
        window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
        uniqueWinnerResolveTimeoutRef.current = null;
      }
    };

    const applyUniqueAuctionResult = (payload: UniqueAuctionEndPayload) => {
      uniqueAuctionResultDismissedRef.current = false;
      setUniqueAuctionResult((prev) => ({
        itemName: lastActiveItemRef.current?.itemName ?? prev?.itemName ?? 'Auction item',
        payload: {
          ...payload,
          myBidPrice: payload.myBidPrice ?? prev?.payload.myBidPrice ?? null,
        },
        winnerInfo: null,
      }));
    };

    const handleUniqueAuctionEndPayload = (payload: UniqueAuctionEndPayload) => {
      setTimerState(null);
      setUniqueBidSyncState(null);
      void requestItemSync('UNIQUE_AUCTION_END');

      if (payload.isWon && ignoreWonUniqueEndRef.current) {
        return;
      }

      if (!payload.isWon) {
        clearPendingUniqueWinnerResolution();
        setWinnerInfo(null);
        applyUniqueAuctionResult(payload);
        return;
      }

      pendingAmbiguousUniqueEndRef.current = payload;

      if (uniqueWinnerResolveTimeoutRef.current !== null) {
        window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
      }

      uniqueWinnerResolveTimeoutRef.current = window.setTimeout(() => {
        const pendingPayload = pendingAmbiguousUniqueEndRef.current;

        if (pendingPayload && !ignoreWonUniqueEndRef.current) {
          setWinnerInfo(null);
          applyUniqueAuctionResult(pendingPayload);
        }

        clearPendingUniqueWinnerResolution();
      }, UNIQUE_WINNER_RESOLVE_DELAY_MS);
    };

    const handleBroadcastEvent = (event: BroadcastStreamEvent) => {
      if (isAuctionStartEvent(event) && event.payload?.timer) {
        clearPendingUniqueWinnerResolution();
        ignoreWonUniqueEndRef.current = false;
        uniqueAuctionResultDismissedRef.current = true;
        setStreamState('live');
        setTimerState(createSyncedTimer(event.payload.timer));
        setUniqueBidSyncState(null);
        setUniqueAuctionResult(null);
        if (typeof event.payload.item?.startPrice === 'number' && typeof event.payload.item?.bidUnit === 'number') {
          setBidSyncState({
            item: {
              bidUnit: event.payload.item.bidUnit,
              currentPrice: event.payload.item.startPrice,
            },
            timer: event.payload.timer,
            isHighestBidder: false,
          });
        }
        setWinnerInfo(null);
        void requestItemSync('AUCTION_START');
        return;
      }

      if (isUniqueAuctionStartEvent(event) && event.payload?.bidRange && event.payload?.timer) {
        clearPendingUniqueWinnerResolution();
        ignoreWonUniqueEndRef.current = false;
        uniqueAuctionResultDismissedRef.current = false;
        setStreamState('live');
        setBidSyncState(null);
        setAuctionStatisticsState(null);
        setUniqueAuctionResult(null);
        setWinnerInfo(null);
        setTimerState(createSyncedTimer(event.payload.timer));
        setUniqueBidSyncState({
          bidRange: event.payload.bidRange,
          timer: event.payload.timer,
          participantCount: 0,
          hasBid: false,
        });
        void requestItemSync('UNIQUE_AUCTION_START');
        return;
      }

      if (isBidPlacedEvent(event)) {
        const isOwnAcceptedBid = streamId ? consumePendingWalletInvalidationForBid(streamId) : false;

        if (isOwnAcceptedBid) {
          void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        }

        if (event.payload?.snipingTimer) {
          snipingTimerSetAtRef.current = Date.now();
          setTimerState(createSyncedTimer(event.payload.snipingTimer));
        }

        if (typeof event.payload?.bidInfo?.amount === 'number') {
          setBidSyncState((prev) =>
            prev
              ? {
                  ...prev,
                  item: {
                    ...prev.item,
                    currentPrice: event.payload?.bidInfo?.amount ?? prev.item.currentPrice,
                  },
                  isHighestBidder: isOwnAcceptedBid,
                }
              : prev,
          );
        }
        return;
      }

      if (isStreamPausedEvent(event)) {
        setStreamState('disconnected');
        setTimerState(null);
        snipingTimerSetAtRef.current = 0;
        return;
      }

      if (isStreamResumedEvent(event)) {
        setStreamState('live');
        void requestItemSync('STREAM_RESUMED');
        return;
      }

      if (isStreamFailedEvent(event)) {
        setStreamState('ended');
        setLiveStateOverride(false);
        setTimerState(null);
        return;
      }

      if (isSystemStreamEndEvent(event)) {
        clearPendingUniqueWinnerResolution();
        ignoreWonUniqueEndRef.current = false;
        uniqueAuctionResultDismissedRef.current = true;
        setStreamState('ended');
        setLiveStateOverride(false);
        setTimerState(null);
        setBidSyncState(null);
        setUniqueBidSyncState(null);
        return;
      }

      if (isAuctionCommentEvent(event) && event.payload?.message) {
        setAuctionCommentState({
          id: Date.now(),
          message: event.payload.message,
        });
        return;
      }

      if (isAuctionItemIntroduceEvent(event)) {
        void requestItemSync('ITEM_INTRODUCE');
        return;
      }

      if (isUniqueAuctionCalculatingEvent(event)) {
        setUniqueBidSyncState((prev) =>
          prev
            ? {
                ...prev,
                participantCount: event.payload?.participantCount ?? prev.participantCount,
              }
            : prev,
        );
        return;
      }

      if (isUniqueAuctionEndPublicEvent(event)) {
        if (isLoggedIn) {
          return;
        }

        setTimerState(null);
        setUniqueBidSyncState(null);
        void requestItemSync();
        return;
      }

      if (isBidEndEvent(event)) {
        setBidSyncState(null);
        void requestItemSync('BID_END');
        return;
      }

      if (isAuctionStatisticsEvent(event) && event.payload) {
        setAuctionStatisticsState(event.payload);
        return;
      }

      if (isUniqueAuctionStatsEvent(event) && event.payload) {
        setUniqueBidSyncState((prev) =>
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
        void requestItemSync('SYSTEM_STREAM_START');
        return;
      }
    };

    const handlePrivateEvent = (event: PrivateStreamEvent) => {
      if (isPrivateBidSyncEvent(event)) {
        applyBidSync(event.payload);
        return;
      }

      if (isPrivateAuctionStatisticsSyncEvent(event)) {
        setAuctionStatisticsState(event.payload ?? null);
        return;
      }

      if (isPrivateItemSyncEvent(event)) {
        const itemSyncSource = pendingItemSyncSourceRef.current;
        pendingItemSyncSourceRef.current = 'UNKNOWN';
        applyItemSync(event.payload, itemSyncSource);
        return;
      }

      if (isUniqueBidSyncEvent(event)) {
        uniqueAuctionResultDismissedRef.current = false;
        setUniqueBidSyncState(event.payload ?? null);
        if (event.payload?.timer) {
          setTimerState(createSyncedTimer(event.payload.timer));
        }
        return;
      }

      if (isPrivateUniqueAuctionEndEvent(event) && event.payload) {
        handleUniqueAuctionEndPayload(event.payload);
        return;
      }

      if (isBidWinnerEvent(event) && event.payload) {
        const payload = event.payload;
        const nextWinnerInfo: WinnerInfoState = {
          payload,
          itemCond: lastActiveItemRef.current?.itemCondition ?? '',
        };
        const winnerAuctionType = lastActiveItemRef.current?.auctionType ?? null;
        const isUniqueWinnerEvent = winnerAuctionType === 'UNIQUE_TOP';

        if (isUniqueWinnerEvent) {
          ignoreWonUniqueEndRef.current = true;
          clearPendingUniqueWinnerResolution();
          setUniqueAuctionResult(null);
          setWinnerInfo(nextWinnerInfo);
          return;
        }

        setWinnerInfo(nextWinnerInfo);
        return;
      }

      if (isUniqueBidAckEvent(event) && event.payload) {
        if (streamId && consumePendingWalletInvalidationForBid(streamId)) {
          void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        }
        setUniqueBidSyncState((prev) => (prev ? { ...prev, hasBid: true } : prev));
        showToast({ type: 'success', message: `${event.payload.amount.toLocaleString()}원 입찰이 접수되었습니다.` });
        return;
      }
    };

    const handleErrorEvent = (event: ErrorStreamEvent) => {
      if (!isStompErrorEvent(event) || !event.payload) {
        return;
      }

      if (streamId) {
        clearPendingWalletInvalidationForBid(streamId);
      }

      if (isUniqueAlreadyBidError(event.payload)) {
        setUniqueBidSyncState((prev) => (prev ? { ...prev, hasBid: true } : prev));
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
        await requestItemSync('INITIAL_SUBSCRIBE');
      })
      .catch((error) => {
        console.error('[stream] failed to subscribe', error);
      });

    return () => {
      isDisposed = true;
      requestItemSyncRef.current = null;
      requestBidSyncRef.current = null;
      requestAuctionStatisticsSyncRef.current = null;
      requestUniqueBidSyncRef.current = null;

      if (uniqueWinnerResolveTimeoutRef.current !== null) {
        window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
        uniqueWinnerResolveTimeoutRef.current = null;
      }

      if (auctionCommentTimeoutRef.current !== null) {
        window.clearTimeout(auctionCommentTimeoutRef.current);
        auctionCommentTimeoutRef.current = null;
      }

      unsubscribeStream();
    };
  }, [hotStateStore, isLoggedIn, queryClient, setStreamState, showToast, streamId]);

  // ---------------------------------------------------------------------------
  // Race-condition-safe ITEM_SYNC on stream live transition.
  // Uses the ref so the call is only made once the subscription is ready.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isStreamLive) return;
    void requestItemSyncRef.current?.('STREAM_LIVE_EFFECT');
  }, [isStreamLive]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const confirmStreamStart = useCallback(() => {
    setLiveStateOverride(true);
    setLiveStartedAt((prev) => prev ?? new Date().toISOString());
    void requestItemSyncRef.current?.('CONFIRM_STREAM_START');
  }, []);

  const markStreamEnded = useCallback(() => {
    setStreamState('ended');
  }, [setStreamState]);

  const clearWinnerInfo = useCallback(() => {
    setWinnerInfo(null);
  }, []);

  const clearUniqueAuctionResult = useCallback(() => {
    uniqueAuctionResultDismissedRef.current = true;

    pendingAmbiguousUniqueEndRef.current = null;

    if (uniqueWinnerResolveTimeoutRef.current !== null) {
      window.clearTimeout(uniqueWinnerResolveTimeoutRef.current);
      uniqueWinnerResolveTimeoutRef.current = null;
    }

    setUniqueAuctionResult(null);
  }, []);

  return {
    isStreamLive,
    liveStartedAt,
    hotStateStore,
    itemSync,
    streamState,
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
