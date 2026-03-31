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
const STREAM_METRICS_QUERY_PARAM = 'streamMetrics';
const STREAM_METRICS_STORAGE_KEY = 'streamMetrics';
const STREAM_METRICS_WINDOW_MS = 10_000;
const STREAM_METRICS_RETENTION_MS = 60_000;
const STREAM_METRICS_MAX_LATENCY_SAMPLES = 200;
const STREAM_METRICS_LOG_INTERVAL_MS = 10_000;
const SYNC_REQUEST_THROTTLE_MS: Record<SyncRequestKind, number> = {
  ITEM_SYNC: 180,
  BID_SYNC: 120,
  AUCTION_STATISTICS_SYNC: 180,
  UNIQUE_BID_SYNC: 180,
};

type SyncRequestKind = 'ITEM_SYNC' | 'BID_SYNC' | 'AUCTION_STATISTICS_SYNC' | 'UNIQUE_BID_SYNC';
type SyncRequestSource =
  | 'INITIAL_SUBSCRIBE'
  | 'STREAM_LIVE_EFFECT'
  | 'ACTIVE_AUCTION_EFFECT'
  | 'ITEM_SYNC_RECEIVED'
  | 'AUCTION_START'
  | 'UNIQUE_AUCTION_START'
  | 'BID_PLACED'
  | 'STREAM_RESUMED'
  | 'ITEM_INTRODUCE'
  | 'BID_END'
  | 'UNIQUE_AUCTION_END'
  | 'SYSTEM_STREAM_START'
  | 'CONFIRM_STREAM_START'
  | 'UNKNOWN';
type MetricsSuppressionReason = 'deduped' | 'throttled' | 'trailing_flush';
type MetricsEventChannel = 'broadcast' | 'private' | 'error';
type SyncRequestInvoker = (source?: SyncRequestSource) => Promise<void>;

type RequestMetrics = {
  sentCount: number;
  dedupedCount: number;
  throttledCount: number;
  trailingFlushCount: number;
  inFlightCurrent: number;
  inFlightMax: number;
  responseCount: number;
  lastSentAt: number | null;
  lastResponseAt: number | null;
  sources: Partial<Record<SyncRequestSource, number>>;
  sentTimestamps: number[];
  responseTimestamps: number[];
  latencyMs: number[];
  pendingSentAt: number[];
};

type StreamMetrics = {
  streamId: string;
  startedAt: number;
  lastUpdatedAt: number;
  broadcastCounts: Record<string, number>;
  privateCounts: Record<string, number>;
  errorCounts: Record<string, number>;
  eventTimestamps: Record<MetricsEventChannel, number[]>;
  requests: Record<SyncRequestKind, RequestMetrics>;
};

type StreamMetricsSnapshot = {
  streamId: string;
  startedAt: string;
  durationMs: number;
  lastUpdatedAt: string;
  events: Record<
    MetricsEventChannel,
    {
      total: number;
      per10Sec: number;
      byType: Record<string, number>;
    }
  >;
  requests: Record<
    SyncRequestKind,
    {
      sentCount: number;
      sentPer10Sec: number;
      responseCount: number;
      responsePer10Sec: number;
      dedupedCount: number;
      throttledCount: number;
      trailingFlushCount: number;
      inFlightCurrent: number;
      inFlightMax: number;
      avgLatencyMs: number | null;
      p95LatencyMs: number | null;
      maxLatencyMs: number | null;
      lastSentAt: string | null;
      lastResponseAt: string | null;
      sources: Partial<Record<SyncRequestSource, number>>;
    }
  >;
};

type StreamMetricsController = {
  enabled: () => boolean;
  list: () => string[];
  snapshot: (streamId?: string) => StreamMetricsSnapshot | StreamMetricsSnapshot[] | null;
  dump: (streamId?: string) => StreamMetricsSnapshot | StreamMetricsSnapshot[] | null;
  reset: (streamId?: string) => void;
  markSyncSuppressed: (streamId: string, kind: SyncRequestKind, reason: MetricsSuppressionReason) => void;
};

const createRequestMetrics = (): RequestMetrics => ({
  sentCount: 0,
  dedupedCount: 0,
  throttledCount: 0,
  trailingFlushCount: 0,
  inFlightCurrent: 0,
  inFlightMax: 0,
  responseCount: 0,
  lastSentAt: null,
  lastResponseAt: null,
  sources: {},
  sentTimestamps: [],
  responseTimestamps: [],
  latencyMs: [],
  pendingSentAt: [],
});

const createStreamMetrics = (streamId: string): StreamMetrics => ({
  streamId,
  startedAt: Date.now(),
  lastUpdatedAt: Date.now(),
  broadcastCounts: {},
  privateCounts: {},
  errorCounts: {},
  eventTimestamps: {
    broadcast: [],
    private: [],
    error: [],
  },
  requests: {
    ITEM_SYNC: createRequestMetrics(),
    BID_SYNC: createRequestMetrics(),
    AUCTION_STATISTICS_SYNC: createRequestMetrics(),
    UNIQUE_BID_SYNC: createRequestMetrics(),
  },
});

const pruneTimestamps = (timestamps: number[], now: number, retentionMs = STREAM_METRICS_RETENTION_MS) =>
  timestamps.filter((timestamp) => now - timestamp <= retentionMs);

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const percentile = (values: number[], target: number) => {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * target) - 1);
  return sorted[index];
};

const countWithinWindow = (timestamps: number[], now: number) =>
  timestamps.reduce((count, timestamp) => count + (now - timestamp <= STREAM_METRICS_WINDOW_MS ? 1 : 0), 0);

const resolveStreamMetricKey = (streamId: string | undefined) => streamId ?? '__unknown__';

const isStreamMetricsEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const queryValue = new URLSearchParams(window.location.search).get(STREAM_METRICS_QUERY_PARAM);
  const storageValue = window.localStorage.getItem(STREAM_METRICS_STORAGE_KEY);

  return queryValue === '1' || storageValue === '1';
};

const getStreamMetricsRegistry = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const metricsWindow = window as Window & {
    __streamMetricsRegistry?: Map<string, StreamMetrics>;
    __streamMetrics?: StreamMetricsController;
  };

  if (!metricsWindow.__streamMetricsRegistry) {
    metricsWindow.__streamMetricsRegistry = new Map<string, StreamMetrics>();
  }

  if (!metricsWindow.__streamMetrics) {
    metricsWindow.__streamMetrics = {
      enabled: () => isStreamMetricsEnabled(),
      list: () => [...metricsWindow.__streamMetricsRegistry!.keys()],
      snapshot: (streamId) => buildStreamMetricsSnapshot(metricsWindow.__streamMetricsRegistry!, streamId),
      dump: (streamId) => {
        const snapshot = buildStreamMetricsSnapshot(metricsWindow.__streamMetricsRegistry!, streamId);
        console.info('[stream-metrics] snapshot', snapshot);
        return snapshot;
      },
      reset: (streamId) => {
        if (streamId) {
          const targetMetrics = metricsWindow.__streamMetricsRegistry!.get(streamId);

          if (targetMetrics) {
            resetStreamMetrics(targetMetrics);
          } else {
            metricsWindow.__streamMetricsRegistry!.set(streamId, createStreamMetrics(streamId));
          }
          return;
        }

        metricsWindow.__streamMetricsRegistry!.forEach((metrics) => {
          resetStreamMetrics(metrics);
        });
      },
      markSyncSuppressed: (streamId, kind, reason) => {
        const metrics = getOrCreateStreamMetrics(metricsWindow.__streamMetricsRegistry!, streamId);
        const requestMetrics = metrics.requests[kind];

        metrics.lastUpdatedAt = Date.now();

        if (reason === 'deduped') {
          requestMetrics.dedupedCount += 1;
          return;
        }

        if (reason === 'throttled') {
          requestMetrics.throttledCount += 1;
          return;
        }

        requestMetrics.trailingFlushCount += 1;
      },
    };
  }

  return metricsWindow.__streamMetricsRegistry;
};

const getOrCreateStreamMetrics = (registry: Map<string, StreamMetrics>, streamId: string) => {
  const existing = registry.get(streamId);

  if (existing) {
    return existing;
  }

  const created = createStreamMetrics(streamId);
  registry.set(streamId, created);
  return created;
};

const resetStreamMetrics = (metrics: StreamMetrics) => {
  const next = createStreamMetrics(metrics.streamId);

  metrics.startedAt = next.startedAt;
  metrics.lastUpdatedAt = next.lastUpdatedAt;
  metrics.broadcastCounts = next.broadcastCounts;
  metrics.privateCounts = next.privateCounts;
  metrics.errorCounts = next.errorCounts;
  metrics.eventTimestamps = next.eventTimestamps;
  metrics.requests = next.requests;
};

const buildRequestSnapshot = (requestMetrics: RequestMetrics, now: number) => ({
  sentCount: requestMetrics.sentCount,
  sentPer10Sec: countWithinWindow(requestMetrics.sentTimestamps, now),
  responseCount: requestMetrics.responseCount,
  responsePer10Sec: countWithinWindow(requestMetrics.responseTimestamps, now),
  dedupedCount: requestMetrics.dedupedCount,
  throttledCount: requestMetrics.throttledCount,
  trailingFlushCount: requestMetrics.trailingFlushCount,
  inFlightCurrent: requestMetrics.inFlightCurrent,
  inFlightMax: requestMetrics.inFlightMax,
  avgLatencyMs: average(requestMetrics.latencyMs),
  p95LatencyMs: percentile(requestMetrics.latencyMs, 0.95),
  maxLatencyMs: requestMetrics.latencyMs.length > 0 ? Math.max(...requestMetrics.latencyMs) : null,
  lastSentAt: requestMetrics.lastSentAt ? new Date(requestMetrics.lastSentAt).toISOString() : null,
  lastResponseAt: requestMetrics.lastResponseAt ? new Date(requestMetrics.lastResponseAt).toISOString() : null,
  sources: requestMetrics.sources,
});

const buildSingleStreamMetricsSnapshot = (metrics: StreamMetrics): StreamMetricsSnapshot => {
  const now = Date.now();

  return {
    streamId: metrics.streamId,
    startedAt: new Date(metrics.startedAt).toISOString(),
    durationMs: now - metrics.startedAt,
    lastUpdatedAt: new Date(metrics.lastUpdatedAt).toISOString(),
    events: {
      broadcast: {
        total: Object.values(metrics.broadcastCounts).reduce((sum, count) => sum + count, 0),
        per10Sec: countWithinWindow(metrics.eventTimestamps.broadcast, now),
        byType: metrics.broadcastCounts,
      },
      private: {
        total: Object.values(metrics.privateCounts).reduce((sum, count) => sum + count, 0),
        per10Sec: countWithinWindow(metrics.eventTimestamps.private, now),
        byType: metrics.privateCounts,
      },
      error: {
        total: Object.values(metrics.errorCounts).reduce((sum, count) => sum + count, 0),
        per10Sec: countWithinWindow(metrics.eventTimestamps.error, now),
        byType: metrics.errorCounts,
      },
    },
    requests: {
      ITEM_SYNC: buildRequestSnapshot(metrics.requests.ITEM_SYNC, now),
      BID_SYNC: buildRequestSnapshot(metrics.requests.BID_SYNC, now),
      AUCTION_STATISTICS_SYNC: buildRequestSnapshot(metrics.requests.AUCTION_STATISTICS_SYNC, now),
      UNIQUE_BID_SYNC: buildRequestSnapshot(metrics.requests.UNIQUE_BID_SYNC, now),
    },
  };
};

const buildStreamMetricsSnapshot = (
  registry: Map<string, StreamMetrics>,
  streamId?: string,
): StreamMetricsSnapshot | StreamMetricsSnapshot[] | null => {
  if (streamId) {
    const metrics = registry.get(streamId);
    return metrics ? buildSingleStreamMetricsSnapshot(metrics) : null;
  }

  return [...registry.values()].map((metrics) => buildSingleStreamMetricsSnapshot(metrics));
};

const trackStreamEvent = (
  metricsRef: React.MutableRefObject<StreamMetrics | null>,
  channel: MetricsEventChannel,
  eventType: string,
) => {
  const metrics = metricsRef.current;

  if (!metrics) {
    return;
  }

  const now = Date.now();
  metrics.lastUpdatedAt = now;

  const counts =
    channel === 'broadcast'
      ? metrics.broadcastCounts
      : channel === 'private'
        ? metrics.privateCounts
        : metrics.errorCounts;

  counts[eventType] = (counts[eventType] ?? 0) + 1;
  metrics.eventTimestamps[channel].push(now);
  metrics.eventTimestamps[channel] = pruneTimestamps(metrics.eventTimestamps[channel], now);
};

const trackSyncRequest = (
  metricsRef: React.MutableRefObject<StreamMetrics | null>,
  kind: SyncRequestKind,
  source: SyncRequestSource,
) => {
  const metrics = metricsRef.current;

  if (!metrics) {
    return;
  }

  const now = Date.now();
  const requestMetrics = metrics.requests[kind];

  metrics.lastUpdatedAt = now;
  requestMetrics.sentCount += 1;
  requestMetrics.inFlightCurrent += 1;
  requestMetrics.inFlightMax = Math.max(requestMetrics.inFlightMax, requestMetrics.inFlightCurrent);
  requestMetrics.lastSentAt = now;
  requestMetrics.sources[source] = (requestMetrics.sources[source] ?? 0) + 1;
  requestMetrics.sentTimestamps.push(now);
  requestMetrics.sentTimestamps = pruneTimestamps(requestMetrics.sentTimestamps, now);
  requestMetrics.pendingSentAt.push(now);
};

const trackSyncResponse = (metricsRef: React.MutableRefObject<StreamMetrics | null>, kind: SyncRequestKind) => {
  const metrics = metricsRef.current;

  if (!metrics) {
    return;
  }

  const now = Date.now();
  const requestMetrics = metrics.requests[kind];
  const sentAt = requestMetrics.pendingSentAt.shift();

  metrics.lastUpdatedAt = now;
  requestMetrics.responseCount += 1;
  requestMetrics.inFlightCurrent = Math.max(0, requestMetrics.inFlightCurrent - 1);
  requestMetrics.lastResponseAt = now;
  requestMetrics.responseTimestamps.push(now);
  requestMetrics.responseTimestamps = pruneTimestamps(requestMetrics.responseTimestamps, now);

  if (typeof sentAt === 'number') {
    requestMetrics.latencyMs.push(now - sentAt);

    if (requestMetrics.latencyMs.length > STREAM_METRICS_MAX_LATENCY_SAMPLES) {
      requestMetrics.latencyMs.splice(0, requestMetrics.latencyMs.length - STREAM_METRICS_MAX_LATENCY_SAMPLES);
    }
  }
};

const trackSyncSuppressed = (
  metricsRef: React.MutableRefObject<StreamMetrics | null>,
  kind: SyncRequestKind,
  reason: MetricsSuppressionReason,
) => {
  const metrics = metricsRef.current;

  if (!metrics) {
    return;
  }

  metrics.lastUpdatedAt = Date.now();

  if (reason === 'deduped') {
    metrics.requests[kind].dedupedCount += 1;
    return;
  }

  if (reason === 'throttled') {
    metrics.requests[kind].throttledCount += 1;
    return;
  }

  metrics.requests[kind].trailingFlushCount += 1;
};

declare global {
  interface Window {
    __streamMetricsRegistry?: Map<string, StreamMetrics>;
    __streamMetrics?: StreamMetricsController;
  }
}

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
  const [timer, setTimer] = useState<SyncedAuctionTimer | null>(null);
  const [bidSync, setBidSync] = useState<BidSyncPayload | null>(null);
  const [uniqueBidSync, setUniqueBidSync] = useState<UniqueBidSyncPayload | null>(null);
  const [itemSync, setItemSync] = useState<ItemSyncPayload | null>(null);
  const [runtimeStreamState, setRuntimeStreamState] = useState<{
    streamId: string | undefined;
    value: StreamState | null;
  }>({
    streamId,
    value: null,
  });
  const [auctionStatistics, setAuctionStatistics] = useState<AuctionStatisticsPayload | null>(null);
  const [auctionComment, setAuctionComment] = useState<{ id: number; message: string } | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<WinnerInfoState | null>(null);
  const [uniqueAuctionResult, setUniqueAuctionResult] = useState<UniqueAuctionResultState | null>(null);

  const lastActiveItemRef = useRef<ItemSyncItem | null>(null);
  const uniqueAuctionResultDismissedRef = useRef(true);
  const snipingTimerSetAtRef = useRef<number>(0);
  const pendingAmbiguousUniqueEndRef = useRef<UniqueAuctionEndPayload | null>(null);
  const uniqueWinnerResolveTimeoutRef = useRef<number | null>(null);
  const ignoreWonUniqueEndRef = useRef(false);
  // Ref that is set once the STOMP subscription is established.
  // Used to gate ITEM_SYNC calls on subscription readiness (race condition fix).
  const requestItemSyncRef = useRef<SyncRequestInvoker | null>(null);
  const requestBidSyncRef = useRef<SyncRequestInvoker | null>(null);
  const requestAuctionStatisticsSyncRef = useRef<SyncRequestInvoker | null>(null);
  const requestUniqueBidSyncRef = useRef<SyncRequestInvoker | null>(null);
  const streamMetricsRef = useRef<StreamMetrics | null>(null);

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

  useEffect(() => {
    if (!streamId || !isStreamMetricsEnabled()) {
      streamMetricsRef.current = null;
      return;
    }

    const registry = getStreamMetricsRegistry();

    if (!registry) {
      streamMetricsRef.current = null;
      return;
    }

    const metricKey = resolveStreamMetricKey(streamId);
    streamMetricsRef.current = getOrCreateStreamMetrics(registry, metricKey);
    console.info('[stream-metrics] enabled', {
      streamId: metricKey,
      queryParam: STREAM_METRICS_QUERY_PARAM,
      storageKey: STREAM_METRICS_STORAGE_KEY,
    });
  }, [streamId]);

  useEffect(() => {
    if (!streamMetricsRef.current) {
      return;
    }

    const metricKey = streamMetricsRef.current.streamId;
    const intervalId = window.setInterval(() => {
      window.__streamMetrics?.dump(metricKey);
    }, STREAM_METRICS_LOG_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [streamId]);

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
        : Promise.all([
            requestBidSyncRef.current?.('ACTIVE_AUCTION_EFFECT'),
            requestAuctionStatisticsSyncRef.current?.('ACTIVE_AUCTION_EFFECT'),
          ]);

    void Promise.resolve(syncPromise).catch((error) => {
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

    const createManagedSyncRequest = (
      kind: SyncRequestKind,
      throttleMs: number,
      send: () => Promise<void>,
    ): SyncRequestInvoker => {
      let disposed = false;
      let lastSentAt = 0;
      let inFlightPromise: Promise<void> | null = null;
      let pendingSource: SyncRequestSource | null = null;
      let pendingPromise: Promise<void> | null = null;
      let resolvePendingPromise: (() => void) | null = null;
      let rejectPendingPromise: ((error: unknown) => void) | null = null;
      let trailingTimeoutId: number | null = null;

      const clearPendingTimeout = () => {
        if (trailingTimeoutId !== null) {
          window.clearTimeout(trailingTimeoutId);
          trailingTimeoutId = null;
        }
      };

      const clearPendingPromise = () => {
        pendingPromise = null;
        resolvePendingPromise = null;
        rejectPendingPromise = null;
      };

      const ensurePendingPromise = () => {
        if (pendingPromise) {
          return pendingPromise;
        }

        pendingPromise = new Promise<void>((resolve, reject) => {
          resolvePendingPromise = resolve;
          rejectPendingPromise = reject;
        });

        return pendingPromise;
      };

      const runRequest = (source: SyncRequestSource, isTrailingFlush: boolean) => {
        lastSentAt = Date.now();
        clearPendingTimeout();

        if (isTrailingFlush) {
          trackSyncSuppressed(streamMetricsRef, kind, 'trailing_flush');
        }

        trackSyncRequest(streamMetricsRef, kind, source);

        const requestPromise = send()
          .catch((error) => {
            throw error;
          })
          .finally(() => {
            inFlightPromise = null;
            flushQueuedRequest();
          });

        inFlightPromise = requestPromise;
        return requestPromise;
      };

      const flushQueuedRequest = () => {
        if (disposed || !pendingSource || inFlightPromise) {
          return;
        }

        const remainingThrottleMs = Math.max(0, lastSentAt + throttleMs - Date.now());

        if (remainingThrottleMs > 0) {
          clearPendingTimeout();
          trailingTimeoutId = window.setTimeout(() => {
            trailingTimeoutId = null;
            flushQueuedRequest();
          }, remainingThrottleMs);
          return;
        }

        const source = pendingSource;
        const resolve = resolvePendingPromise;
        const reject = rejectPendingPromise;
        pendingSource = null;
        clearPendingPromise();

        void runRequest(source, true).then(
          () => resolve?.(),
          (error) => reject?.(error),
        );
      };

      const queueRequest = (source: SyncRequestSource, reason: Exclude<MetricsSuppressionReason, 'trailing_flush'>) => {
        pendingSource = source;
        trackSyncSuppressed(streamMetricsRef, kind, reason);
        const queuedPromise = ensurePendingPromise();
        flushQueuedRequest();
        return queuedPromise;
      };

      const request: SyncRequestInvoker = (source = 'UNKNOWN') => {
        if (disposed) {
          return Promise.resolve();
        }

        if (inFlightPromise) {
          return queueRequest(source, 'deduped');
        }

        const remainingThrottleMs = Math.max(0, lastSentAt + throttleMs - Date.now());

        if (remainingThrottleMs > 0) {
          return queueRequest(source, 'throttled');
        }

        return runRequest(source, false);
      };

      (request as SyncRequestInvoker & { dispose?: () => void }).dispose = () => {
        disposed = true;
        clearPendingTimeout();
        pendingSource = null;
        clearPendingPromise();
      };

      return request;
    };

    const requestItemSync = createManagedSyncRequest('ITEM_SYNC', SYNC_REQUEST_THROTTLE_MS.ITEM_SYNC, async () => {
      console.log('[stream] requesting ITEM_SYNC for streamId:', streamId);
      await sendStreamMessage(streamId, {
        eventType: 'ITEM_SYNC',
        payload: null,
      });
    });

    const requestBidSync = createManagedSyncRequest('BID_SYNC', SYNC_REQUEST_THROTTLE_MS.BID_SYNC, async () => {
      await sendStreamMessage(streamId, {
        eventType: 'BID_SYNC',
        payload: null,
      });
    });

    const requestAuctionStatisticsSync = createManagedSyncRequest(
      'AUCTION_STATISTICS_SYNC',
      SYNC_REQUEST_THROTTLE_MS.AUCTION_STATISTICS_SYNC,
      async () => {
        await sendStreamMessage(streamId, {
          eventType: 'AUCTION_STATISTICS_SYNC',
          payload: null,
        });
      },
    );

    const requestUniqueBidSync = createManagedSyncRequest(
      'UNIQUE_BID_SYNC',
      SYNC_REQUEST_THROTTLE_MS.UNIQUE_BID_SYNC,
      async () => {
        await sendStreamMessage(streamId, {
          eventType: 'UNIQUE_BID_SYNC',
          payload: null,
        });
      },
    );

    requestItemSyncRef.current = requestItemSync;
    requestBidSyncRef.current = requestBidSync;
    requestAuctionStatisticsSyncRef.current = requestAuctionStatisticsSync;
    requestUniqueBidSyncRef.current = requestUniqueBidSync;

    const requestActiveAuctionSync = async (item: ItemSyncItem | null, source: SyncRequestSource = 'UNKNOWN') => {
      if (!item || item.auctionStatus !== 'LIVE') {
        return;
      }

      if (item.auctionType === 'UNIQUE_TOP') {
        await requestUniqueBidSync(source);
        return;
      }

      await Promise.all([requestBidSync(source), requestAuctionStatisticsSync(source)]);
    };

    const applyBidSync = (payload?: BidSyncPayload | null) => {
      setBidSync(payload ?? null);
      const snipingAge = Date.now() - snipingTimerSetAtRef.current;
      if (payload?.timer && snipingAge > 2000) {
        setTimer(createSyncedTimer(payload.timer, 'remainingSnapshot'));
      }
    };

    const applyItemSync = (payload?: ItemSyncPayload | null) => {
      setItemSync(payload ?? null);
      const nextActiveItem = payload?.items.find((item) => item.auctionStatus === 'LIVE') ?? null;
      if (nextActiveItem?.auctionType === 'UNIQUE_TOP') {
        uniqueAuctionResultDismissedRef.current = false;
      }
      void requestActiveAuctionSync(nextActiveItem, 'ITEM_SYNC_RECEIVED');
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
      setTimer(null);
      setUniqueBidSync(null);
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
      trackStreamEvent(streamMetricsRef, 'broadcast', event.eventType ?? event.event ?? 'UNKNOWN');
      console.log('[stream] broadcast event:', event);
      if (isAuctionStartEvent(event) && event.payload?.timer) {
        clearPendingUniqueWinnerResolution();
        ignoreWonUniqueEndRef.current = false;
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
        void requestItemSync('AUCTION_START');
        return;
      }

      if (isUniqueAuctionStartEvent(event) && event.payload?.bidRange && event.payload?.timer) {
        clearPendingUniqueWinnerResolution();
        ignoreWonUniqueEndRef.current = false;
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
        void requestItemSync('UNIQUE_AUCTION_START');
        return;
      }

      if (isBidPlacedEvent(event)) {
        if (streamId && consumePendingWalletInvalidationForBid(streamId)) {
          void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        }

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

        void requestBidSync('BID_PLACED');
        return;
      }

      if (isStreamPausedEvent(event)) {
        setStreamState('disconnected');
        setTimer(null);
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
        setTimer(null);
        return;
      }

      if (isSystemStreamEndEvent(event)) {
        clearPendingUniqueWinnerResolution();
        ignoreWonUniqueEndRef.current = false;
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
        void requestItemSync('ITEM_INTRODUCE');
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

      if (isUniqueAuctionEndPublicEvent(event)) {
        if (isLoggedIn) {
          return;
        }

        setTimer(null);
        setUniqueBidSync(null);
        void requestItemSync();
        return;
      }

      if (isBidEndEvent(event)) {
        setBidSync(null);
        void requestItemSync('BID_END');
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
        void requestItemSync('SYSTEM_STREAM_START');
        return;
      }
    };

    const handlePrivateEvent = (event: PrivateStreamEvent) => {
      trackStreamEvent(streamMetricsRef, 'private', event.eventType ?? 'UNKNOWN');
      if (isPrivateBidSyncEvent(event)) {
        trackSyncResponse(streamMetricsRef, 'BID_SYNC');
        applyBidSync(event.payload);
        return;
      }

      if (isPrivateAuctionStatisticsSyncEvent(event)) {
        trackSyncResponse(streamMetricsRef, 'AUCTION_STATISTICS_SYNC');
        setAuctionStatistics(event.payload ?? null);
        return;
      }

      if (isPrivateItemSyncEvent(event)) {
        trackSyncResponse(streamMetricsRef, 'ITEM_SYNC');
        applyItemSync(event.payload);
        return;
      }

      if (isUniqueBidSyncEvent(event)) {
        trackSyncResponse(streamMetricsRef, 'UNIQUE_BID_SYNC');
        uniqueAuctionResultDismissedRef.current = false;
        setUniqueBidSync(event.payload ?? null);
        if (event.payload?.timer) {
          setTimer(createSyncedTimer(event.payload.timer));
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
        setUniqueBidSync((prev) => (prev ? { ...prev, hasBid: true } : prev));
        showToast({ type: 'success', message: `${event.payload.amount.toLocaleString()}원 입찰이 접수되었습니다.` });
        return;
      }
    };

    const handleErrorEvent = (event: ErrorStreamEvent) => {
      trackStreamEvent(
        streamMetricsRef,
        'error',
        isStompErrorEvent(event) ? (event.payload?.code ?? event.eventType) : event.eventType,
      );
      if (!isStompErrorEvent(event) || !event.payload) {
        return;
      }

      if (streamId) {
        clearPendingWalletInvalidationForBid(streamId);
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

      (requestItemSync as SyncRequestInvoker & { dispose?: () => void }).dispose?.();
      (requestBidSync as SyncRequestInvoker & { dispose?: () => void }).dispose?.();
      (requestAuctionStatisticsSync as SyncRequestInvoker & { dispose?: () => void }).dispose?.();
      (requestUniqueBidSync as SyncRequestInvoker & { dispose?: () => void }).dispose?.();

      unsubscribeStream();
    };
  }, [isLoggedIn, queryClient, setStreamState, showToast, streamId]);

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
