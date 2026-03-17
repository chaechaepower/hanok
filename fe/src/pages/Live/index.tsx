import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { useGetStreamEnter } from '@/api/hooks/useGetStreamEnter';
import { useStompViewerCount } from '@/hooks/useStompViewerCount';
import { useLiveKit } from '@/hooks/useLiveKit';
import WinModal from '@/components/Live/Auction/Buyer/WinModal';
import UniqueAuctionResultModal from '@/components/Live/Auction/Buyer/UniqueAuctionResultModal';
import AuctionTimer from '@/components/Live/Auction/shared/AuctionTimer';
import AuctionCommentToast from '@/components/Live/Stream/AuctionCommentToast';
import ControlBar from '@/components/Live/Stream/ControlBar';
import StreamDisconnected from '@/components/Live/Stream/Streamdisconnected';
import StreamEnded from '@/components/Live/Stream/StreamEnded';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import { useToast } from '@/components/common/Toast';
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
  StreamRequest,
  StreamState,
  StreamEnterResponse,
  StreamTimerPayload,
  SyncedAuctionTimer,
  UniqueAuctionEndPayload,
  UniqueBidSyncPayload,
} from '@/types';
import { sendStreamMessage, subscribeStream } from '@/websocket/stompClient';

import LeftPanel from './LeftPanel';
import LiveHeader from './LiveHeader';
import RightPanel from './RightPanel';
import SellerStartModal from './SellerStartModal';

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

const isBidSyncEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'BID_SYNC' }> => event.eventType === 'BID_SYNC';

const isItemSyncEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'ITEM_SYNC' }> => event.eventType === 'ITEM_SYNC';

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

const isUniqueAuctionIntroduceEvent = (
  event: BroadcastStreamEvent,
): event is Extract<BroadcastStreamEvent, { eventType: 'UNIQUE_AUCTION_INTRODUCE' }> =>
  event.eventType === 'UNIQUE_AUCTION_INTRODUCE';

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

const isLegacyUniqueAuctionEndEvent = (event: {
  eventType: string;
  payload?: unknown;
}): event is { eventType: 'UNIQUE_AUCTION_END'; payload?: UniqueAuctionEndPayload } =>
  event.eventType === 'UNIQUE_AUCTION_END';

const isBidWinnerEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'BID_WINNER' }> => event.eventType === 'BID_WINNER';

const isUniqueBidAckEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'UNIQUE_BID_ACK' }> => event.eventType === 'UNIQUE_BID_ACK';

const isUniqueBidSyncEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'UNIQUE_BID_SYNC' }> => event.eventType === 'UNIQUE_BID_SYNC';

const isStompErrorEvent = (event: ErrorStreamEvent): event is Extract<ErrorStreamEvent, { eventType: 'ERROR' }> =>
  event.eventType === 'ERROR';

const isUniqueAlreadyBidError = (payload?: StompErrorPayload) => payload?.code === 'UNIQUE-003';

const createSyncedTimer = (timer: StreamTimerPayload): SyncedAuctionTimer => ({
  ...timer,
  receivedAtMs: Date.now(),
});

export default function LivePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const location = useLocation();
  const { id: streamId } = useParams<{ id: string }>();
  const numericStreamId = Number(streamId);
  const shouldAutoOpenStartModal =
    (location.state as { autoOpenStartModal?: boolean } | null)?.autoOpenStartModal === true;
  const { data: streamEnter } = useGetStreamEnter(numericStreamId);
  const { viewerCount } = useStompViewerCount();
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [timer, setTimer] = useState<SyncedAuctionTimer | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<{
    payload: BidWinnerPayload;
    itemCond: ItemSyncItem['itemCondition'] | '';
  } | null>(null);
  const [showSellerStartModal, setShowSellerStartModal] = useState(false);
  const [liveStateOverride, setLiveStateOverride] = useState<boolean | null>(null);
  const [auctionStatistics, setAuctionStatistics] = useState<AuctionStatisticsPayload | null>(null);
  const [bidSync, setBidSync] = useState<BidSyncPayload | null>(null);
  const [uniqueBidSync, setUniqueBidSync] = useState<UniqueBidSyncPayload | null>(null);
  const [itemSync, setItemSync] = useState<ItemSyncPayload | null>(null);
  const [streamState, setStreamState] = useState<StreamState>('live');
  const [uniqueAuctionResult, setUniqueAuctionResult] = useState<{
    itemName: string;
    payload: UniqueAuctionEndPayload;
  } | null>(null);
  const [auctionComment, setAuctionComment] = useState<{ id: number; message: string } | null>(null);
  const autoOpenedStartModalStreamIdRef = useRef<number | null>(null);
  const lastActiveItemRef = useRef<ItemSyncItem | null>(null);
  const postStartStream = usePostStartStream();
  const readyItems = itemSync?.items.filter((item) => item.auctionStatus === 'READY') ?? [];
  const introducingAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'INTRODUCING') ?? null;
  const liveAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'LIVE') ?? null;
  const selectedAuctionItem = itemSync?.items.find((item) => item.auctionId === selectedAuctionId) ?? null;
  const visibleSelectedAuctionId =
    selectedAuctionItem &&
    selectedAuctionItem.auctionStatus !== 'SOLD' &&
    selectedAuctionItem.auctionStatus !== 'UNSOLD'
      ? selectedAuctionId
      : null;
  const selectedReadyAuctionItem = selectedAuctionItem?.auctionStatus === 'READY' ? selectedAuctionItem : null;
  const fallbackReadyAuctionItem = readyItems[0] ?? null;
  const introduceAuctionId = selectedReadyAuctionItem?.auctionId ?? fallbackReadyAuctionItem?.auctionId ?? null;
  const introduceAuctionType = selectedReadyAuctionItem?.auctionType ?? fallbackReadyAuctionItem?.auctionType ?? null;
  const startAuctionId = introducingAuctionItem?.auctionId ?? null;
  const startAuctionType = introducingAuctionItem?.auctionType ?? null;
  const activeBidAuctionId = liveAuctionItem?.auctionId ?? introducingAuctionItem?.auctionId ?? null;
  const activeAuctionType = liveAuctionItem?.auctionType ?? introducingAuctionItem?.auctionType ?? null;
  const activeStreamEnter: StreamEnterResponse | null = streamEnter ?? null;
  const storedUserId =
    typeof window === 'undefined' ? 0 : Number.parseInt(window.localStorage.getItem('userId') ?? '0', 10);
  const currentUserId = Number.isFinite(storedUserId) ? storedUserId : 0;
  const isSeller = activeStreamEnter?.seller.sellerId === currentUserId;
  const isStreamLive = liveStateOverride ?? Boolean(activeStreamEnter?.isLive);

  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL ?? '';
  const livekitToken = activeStreamEnter?.token ?? '';
  const { state: livekitState, videoRef, toggleMic, toggleCamera, isMicOn, isCameraOn } = useLiveKit({
    serverUrl: isStreamLive ? livekitUrl : '',
    token: isStreamLive ? livekitToken : '',
    isHost: isSeller,
  });
  const canIntroduce = liveAuctionItem === null && introducingAuctionItem === null && introduceAuctionId !== null;
  const canStart = liveAuctionItem === null && startAuctionId !== null;
  const canIntroduceAuction = isStreamLive && canIntroduce;
  const canStartAuction = isStreamLive && canStart;
  const startRequest = useMemo<StreamRequest | null>(
    () =>
      activeStreamEnter
        ? {
            title: activeStreamEnter.title,
            category: activeStreamEnter.category,
            startType: activeStreamEnter.startType,
            scheduledAt: activeStreamEnter.scheduledAt ?? undefined,
            notice: activeStreamEnter.notice ?? undefined,
            itemIds: (activeStreamEnter.items ?? []).map((item) => item.itemId),
          }
        : null,
    [activeStreamEnter],
  );

  const handleSellerStartModalConfirm = async () => {
    if (
      isStreamLive ||
      postStartStream.isPending ||
      !startRequest ||
      !Number.isFinite(numericStreamId) ||
      numericStreamId <= 0
    ) {
      return;
    }

    try {
      await postStartStream.mutateAsync({
        streamId: numericStreamId,
        request: startRequest,
      });
      setLiveStateOverride(true);
      setShowSellerStartModal(false);
    } catch (error) {
      console.error('[stream] failed to start stream', error);
    }
  };

  const streamTitle = activeStreamEnter?.title ?? '방송 제목';

  useEffect(() => {
    if (
      !shouldAutoOpenStartModal ||
      !isSeller ||
      !streamEnter ||
      !startRequest ||
      !Number.isFinite(numericStreamId) ||
      numericStreamId <= 0 ||
      isStreamLive
    ) {
      return;
    }

    if (autoOpenedStartModalStreamIdRef.current === numericStreamId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      autoOpenedStartModalStreamIdRef.current = numericStreamId;
      setShowSellerStartModal(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSeller, isStreamLive, numericStreamId, shouldAutoOpenStartModal, startRequest, streamEnter]);

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

  useEffect(() => {
    const nextActiveItem = liveAuctionItem ?? introducingAuctionItem;

    if (nextActiveItem) {
      lastActiveItemRef.current = nextActiveItem;
    }
  }, [introducingAuctionItem, liveAuctionItem]);

  useEffect(() => {
    if (!streamId || activeBidAuctionId === null || !activeAuctionType) {
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: activeAuctionType === 'UNIQUE_TOP' ? 'UNIQUE_BID_SYNC' : 'BID_SYNC',
      payload: null,
    }).catch((error) => {
      console.error('[stream] failed to sync active auction state', error);
    });
  }, [activeAuctionType, activeBidAuctionId, streamId]);

  useEffect(() => {
    if (!streamId || !isStreamLive) {
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: 'ITEM_SYNC',
      payload: null,
    }).catch((error) => {
      console.error('[stream] failed to sync items after stream start', error);
    });
  }, [isStreamLive, streamId]);

  useEffect(() => {
    if (!streamId) {
      return;
    }

    const requestItemSync = async () => {
      await sendStreamMessage(streamId, {
        eventType: 'ITEM_SYNC',
        payload: null,
      });
    };

    const requestActiveAuctionSync = async (item: ItemSyncItem | null) => {
      if (!item) {
        return;
      }

      await sendStreamMessage(streamId, {
        eventType: item.auctionType === 'UNIQUE_TOP' ? 'UNIQUE_BID_SYNC' : 'BID_SYNC',
        payload: null,
      });
    };

    const handleBroadcastEvent = (event: BroadcastStreamEvent) => {
      if (isAuctionStartEvent(event) && event.payload?.timer) {
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
          });
        }
        setWinnerInfo(null);
        void requestItemSync();
        return;
      }

      if (isUniqueAuctionStartEvent(event) && event.payload?.bidRange && event.payload?.timer) {
        setStreamState('live');
        setBidSync(null);
        setAuctionStatistics(null);
        setUniqueAuctionResult(null);
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
        return;
      }

      if (isBidSyncEvent(event)) {
        setBidSync(event.payload ?? null);
        if (event.payload?.timer) {
          setTimer(createSyncedTimer(event.payload.timer));
        }
        return;
      }

      if (isItemSyncEvent(event)) {
        setItemSync(event.payload ?? null);
        const nextActiveItem =
          event.payload?.items.find((item) => item.auctionStatus === 'LIVE') ??
          event.payload?.items.find((item) => item.auctionStatus === 'INTRODUCING') ??
          null;
        void requestActiveAuctionSync(nextActiveItem);
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

      if (isUniqueAuctionIntroduceEvent(event)) {
        void requestItemSync();
        return;
      }

      if (isUniqueAuctionCalculatingEvent(event)) {
        return;
      }

      if (isUniqueAuctionEndEvent(event) && event.payload) {
        setUniqueAuctionResult({
          itemName: lastActiveItemRef.current?.itemName ?? '경매 상품',
          payload: event.payload,
        });
        setUniqueBidSync(null);
        void requestItemSync();
        return;
      }

      if (isBidEndEvent(event)) {
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
      }
    };

    const handlePrivateEvent = (event: PrivateStreamEvent) => {
      if (isUniqueBidSyncEvent(event)) {
        setUniqueBidSync(event.payload ?? null);
        if (event.payload?.timer) {
          setTimer(createSyncedTimer(event.payload.timer));
        }
        return;
      }

      if (isBidWinnerEvent(event) && event.payload) {
        setWinnerInfo({
          payload: event.payload,
          itemCond: lastActiveItemRef.current?.itemCondition ?? '',
        });
        return;
      }

      if (isUniqueBidAckEvent(event) && event.payload) {
        setUniqueBidSync((prev) => (prev ? { ...prev, hasBid: true } : prev));
        showToast({ message: `${event.payload.amount.toLocaleString()}원 입찰이 접수되었습니다.` });
        return;
      }

      if (isLegacyUniqueAuctionEndEvent(event) && event.payload) {
        setUniqueAuctionResult({
          itemName: lastActiveItemRef.current?.itemName ?? '경매 상품',
          payload: event.payload,
        });
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
        await requestItemSync();
      })
      .catch((error) => {
        console.error('[stream] failed to subscribe', error);
      });

    return () => {
      isDisposed = true;
      unsubscribeStream();
    };
  }, [showToast, streamId]);

  const handleWinConfirm = async () => {
    await Promise.resolve();
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    setWinnerInfo(null);
  };

  const handleUniqueAuctionResultClose = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    setUniqueAuctionResult(null);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-surface p-3">
      <LiveHeader streamTitle={streamTitle} isLive={isStreamLive} startedAt={activeStreamEnter?.createdAt ?? null} />

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl">
          <LeftPanel
            isSeller={isSeller}
            syncedItems={itemSync?.items ?? null}
            selectedAuctionId={visibleSelectedAuctionId}
            onSelectAuctionItem={setSelectedAuctionId}
          />
        </div>
        <div className="relative min-w-0 flex-2 overflow-hidden rounded-2xl bg-background">
          <StreamOverlay viewerCount={viewerCount} isSeller={isSeller} />
          {isSeller && <SellerGuideOverlay />}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-contain ${livekitState === 'connected' ? '' : 'hidden'}`}
          />
          {livekitState !== 'connected' && <StreamPlaceholder />}
          <ControlBar
            isSeller={isSeller}
            auctionType={activeAuctionType}
            bidSync={bidSync}
            uniqueBidSync={uniqueBidSync}
            activeBidAuctionId={activeBidAuctionId}
            introduceAuctionId={introduceAuctionId}
            introduceAuctionType={introduceAuctionType}
            startAuctionId={startAuctionId}
            startAuctionType={startAuctionType}
            canIntroduce={canIntroduceAuction}
            canStart={canStartAuction}
            readyItems={readyItems}
            selectedAuctionId={selectedAuctionId}
            onSelectAuctionItem={setSelectedAuctionId}
            toggleMic={toggleMic}
            toggleCamera={toggleCamera}
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
          />

          {(activeStreamEnter?.notice || auctionComment) && (
            <AuctionCommentToast
              key={auctionComment?.id ?? 'stream-notice'}
              notice={activeStreamEnter?.notice ?? null}
              message={auctionComment?.message ?? null}
            />
          )}

          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {timer && <AuctionTimer key={timer.receivedAtMs} timer={timer} onExpire={() => undefined} />}
          </div>

          <SellerStartModal
            open={showSellerStartModal && isSeller && !isStreamLive}
            streamTitle={streamTitle}
            isPending={postStartStream.isPending}
            onConfirm={() => {
              void handleSellerStartModalConfirm();
            }}
          />
          {winnerInfo && (
            <WinModal
              isOpen
              itemName={winnerInfo.payload.item.itemName}
              itemCond={winnerInfo.itemCond || 'Auction item'}
              finalPrice={winnerInfo.payload.item.finalPrice}
              address={winnerInfo.payload.shipping}
              onConfirm={handleWinConfirm}
              onClose={() => setWinnerInfo(null)}
            />
          )}
          {uniqueAuctionResult && (
            <UniqueAuctionResultModal
              isOpen
              itemName={uniqueAuctionResult.itemName}
              payload={uniqueAuctionResult.payload}
              onClose={handleUniqueAuctionResultClose}
            />
          )}
          {streamState === 'disconnected' && (
            <StreamDisconnected
              initialSeconds={30}
              onTimeout={() => {
                setStreamState('ended');
              }}
            />
          )}
          {streamState === 'ended' && (
            <StreamEnded
              onClose={() => {
                navigate(-1);
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl">
          <RightPanel
            isSeller={isSeller}
            auctionType={activeAuctionType}
            auctionStatistics={auctionStatistics}
            uniqueBidSync={uniqueBidSync}
            streamEnter={activeStreamEnter}
          />
        </div>
      </div>
    </div>
  );
}
