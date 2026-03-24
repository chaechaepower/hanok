import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { usePostEndStream } from '@/api/hooks/usePostEndStream';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { useGetStreamEnter } from '@/api/hooks/useGetStreamEnter';
import { useLiveKit } from '@/hooks/useLiveKit';
import { useLiveStream } from '@/hooks/useLiveStream';
import WinModal from '@/components/Live/Auction/Buyer/WinModal';
import UniqueAuctionResultModal from '@/components/Live/Auction/Buyer/UniqueAuctionResultModal';
import AuctionTimer from '@/components/Live/Auction/shared/AuctionTimer';
import AuctionCommentToast from '@/components/Live/Stream/AuctionCommentToast';
import SellerControlBar from '@/components/Live/Stream/SellerControlBar';
import BuyerControlBar from '@/components/Live/Stream/BuyerControlBar';
import StreamDisconnected from '@/components/Live/Stream/Streamdisconnected';
import StreamEnded from '@/components/Live/Stream/StreamEnded';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import type { StreamRequest } from '@/types';
import { sendStreamMessage } from '@/websocket/stompClient';

import LeftPanel from './LeftPanel';
import LiveHeader from './LiveHeader';
import RightPanel from './RightPanel';
import SellerStartModal from './SellerStartModal';
import StreamEndModal from './StreamEndModal';

const STARTED_STREAM_IDS_STORAGE_KEY = 'startedLiveStreamIds';

const CHAT_PANEL_INITIAL = { flex: 0, opacity: 0 };
const CHAT_PANEL_ANIMATE = { flex: 1, opacity: 1 };
const CHAT_PANEL_TRANSITION = { type: 'spring', stiffness: 400, damping: 30 } as const;

const getStartedLiveStreamIds = () => {
  if (typeof window === 'undefined') {
    return new Set<number>();
  }

  const raw = window.sessionStorage.getItem(STARTED_STREAM_IDS_STORAGE_KEY);

  if (!raw) {
    return new Set<number>();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    return new Set(
      parsed.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0),
    );
  } catch {
    return new Set<number>();
  }
};

const persistStartedLiveStreamIds = (streamIds: Set<number>) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(STARTED_STREAM_IDS_STORAGE_KEY, JSON.stringify([...streamIds]));
};

const markStartedLiveStream = (streamId: number) => {
  const next = getStartedLiveStreamIds();
  next.add(streamId);
  persistStartedLiveStreamIds(next);
};

const unmarkStartedLiveStream = (streamId: number) => {
  const next = getStartedLiveStreamIds();
  next.delete(streamId);
  persistStartedLiveStreamIds(next);
};

export default function LivePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { id: streamId } = useParams<{ id: string }>();
  const numericStreamId = Number(streamId);
  const shouldAutoOpenStartModal =
    (location.state as { autoOpenStartModal?: boolean } | null)?.autoOpenStartModal === true;
  const { data: streamEnter } = useGetStreamEnter(numericStreamId);
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [showSellerStartModal, setShowSellerStartModal] = useState(false);
  const [showStreamEndModal, setShowStreamEndModal] = useState(false);
  const autoOpenedStartModalStreamIdRef = useRef<number | null>(null);
  const uniqueCalculatingSentAuctionIdRef = useRef<number | null>(null);
  const postStartStream = usePostStartStream();
  const postEndStream = usePostEndStream();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const handleToggleChat = useCallback(() => setIsChatOpen((prev) => !prev), []);

  const activeStreamEnter = streamEnter ?? null;
  const isSeller = activeStreamEnter?.isHost ?? false;
  const [startedStreamIds] = useState(() => getStartedLiveStreamIds());
  const hasStartedThisStream = Number.isFinite(numericStreamId) && startedStreamIds.has(numericStreamId);

  const {
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
  } = useLiveStream(streamId, activeStreamEnter?.status === 'LIVE');

  const readyItems = useMemo(
    () => itemSync?.items.filter((item) => item.auctionStatus === 'READY') ?? [],
    [itemSync?.items],
  );
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
  const startAuctionId = introducingAuctionItem?.auctionId ?? null;
  const startAuctionType = introducingAuctionItem?.auctionType ?? null;
  const activeBidAuctionId = liveAuctionItem?.auctionId ?? null;
  const activeAuctionType = liveAuctionItem?.auctionType ?? null;

  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL ?? '';
  const livekitToken = activeStreamEnter?.token ?? '';
  const {
    state: livekitState,
    videoRef,
    bgVideoRef,
    toggleMic,
    toggleCamera,
    toggleRemoteAudio,
    isMicOn,
    isCameraOn,
    isRemoteAudioMuted,
    viewerCount,
    disconnect,
  } = useLiveKit({
    serverUrl: isStreamLive ? livekitUrl : '',
    token: isStreamLive ? livekitToken : '',
    isHost: isSeller,
  });
  const canIntroduce = liveAuctionItem === null && introducingAuctionItem === null && introduceAuctionId !== null;
  const canStart = liveAuctionItem === null && startAuctionId !== null;
  const canIntroduceAuction = isStreamLive && canIntroduce;
  const canStartAuction = isStreamLive && canStart;
  const isAuctionInProgress = liveAuctionItem !== null;
  const hasPendingAuctionItems =
    itemSync?.items.some((item) => item.auctionStatus === 'READY' || item.auctionStatus === 'INTRODUCING') ?? false;
  const startRequest = useMemo<StreamRequest | null>(
    () =>
      activeStreamEnter
        ? {
            title: activeStreamEnter.title,
            category: activeStreamEnter.category,
            startType: activeStreamEnter.startType,
            scheduledAt: activeStreamEnter.scheduledAt ?? undefined,
            notice: activeStreamEnter.notice ?? undefined,
            auctionItems: (activeStreamEnter.items ?? []).map((item) =>
              item.auctionType === 'UNIQUE_TOP'
                ? {
                    itemId: item.itemId,
                    auctionType: 'UNIQUE_TOP',
                    auctionDuration: item.auctionTime ?? 0,
                    bottomUp: null,
                    uniqueTop: {
                      minPrice: item.minPrice ?? item.startPrice,
                      maxPrice: item.maxPrice ?? item.startPrice,
                    },
                  }
                : {
                    itemId: item.itemId,
                    auctionType: 'BOTTOM_UP',
                    auctionDuration: item.auctionTime ?? 0,
                    bottomUp: {
                      startPrice: item.startPrice,
                      bidUnit: item.bidUnit ?? 0,
                    },
                    uniqueTop: null,
                  },
            ),
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
      markStartedLiveStream(numericStreamId);
      confirmStreamStart();
      setShowSellerStartModal(false);
    } catch (error) {
      console.error('[stream] failed to start stream', error);
    }
  };

  const handleOpenStreamEndModal = () => {
    if (isAuctionInProgress || postEndStream.isPending) {
      return;
    }

    setShowStreamEndModal(true);
  };

  const handleStreamEndConfirm = async () => {
    if (!Number.isFinite(numericStreamId) || numericStreamId <= 0) {
      return;
    }

    try {
      await postEndStream.mutateAsync(numericStreamId);
      unmarkStartedLiveStream(numericStreamId);
      disconnect();
      setShowStreamEndModal(false);
      markStreamEnded();
      navigate('/main');
    } catch (error) {
      console.error('[stream] failed to end stream', error);
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
      isStreamLive ||
      hasStartedThisStream
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
  }, [
    hasStartedThisStream,
    isSeller,
    isStreamLive,
    numericStreamId,
    shouldAutoOpenStartModal,
    startRequest,
    streamEnter,
  ]);

  useEffect(() => {
    if (!Number.isFinite(numericStreamId) || numericStreamId <= 0 || streamState !== 'ended') {
      return;
    }

    unmarkStartedLiveStream(numericStreamId);
  }, [numericStreamId, streamState]);

  const handleWinConfirm = async () => {
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    clearWinnerInfo();
  };

  const handleUniqueAuctionResultClose = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    clearUniqueAuctionResult();
  };

  const handleAuctionTimerExpire = useCallback(() => {
    if (!streamId || activeAuctionType !== 'UNIQUE_TOP' || activeBidAuctionId === null) {
      return;
    }

    if (uniqueCalculatingSentAuctionIdRef.current === activeBidAuctionId) {
      return;
    }

    uniqueCalculatingSentAuctionIdRef.current = activeBidAuctionId;

    void sendStreamMessage(streamId, {
      eventType: 'UNIQUE_AUCTION_CALCULATING',
      payload: {
        auctionId: activeBidAuctionId,
        message: '집계 중입니다...',
      },
    }).catch((error) => {
      uniqueCalculatingSentAuctionIdRef.current = null;
      console.error('[stream] failed to send unique auction calculating event', error);
    });
  }, [activeAuctionType, activeBidAuctionId, streamId]);

  return (
    <div className="flex h-screen w-full flex-col bg-surface p-3">
      <LiveHeader
        streamTitle={streamTitle}
        isLive={isStreamLive}
        startedAt={liveStartedAt ?? activeStreamEnter?.createdAt ?? null}
        showEndButton={isSeller && isStreamLive}
        isEndDisabled={isAuctionInProgress}
        isEnding={postEndStream.isPending}
        onEndStream={handleOpenStreamEndModal}
      />

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
            ref={bgVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover -scale-x-100 blur-2xl brightness-50 saturate-120 ${livekitState === 'connected' ? '' : 'hidden'}`}
          />
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`relative h-full w-full object-contain -scale-x-100 ${livekitState === 'connected' ? '' : 'hidden'}`}
          />
          {livekitState !== 'connected' && <StreamPlaceholder />}
          {isSeller ? (
            <SellerControlBar
              introduceAuctionId={introduceAuctionId}
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
          ) : (
            <BuyerControlBar
              auctionType={activeAuctionType}
              bidSync={bidSync}
              uniqueBidSync={uniqueBidSync}
              activeAuctionId={activeBidAuctionId}
              isRemoteAudioMuted={isRemoteAudioMuted}
              onToggleMute={toggleRemoteAudio}
              onToggleChat={handleToggleChat}
            />
          )}

          {auctionComment && <AuctionCommentToast key={auctionComment.id} message={auctionComment?.message ?? null} />}

          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {timer && <AuctionTimer key={timer.receivedAtMs} timer={timer} onExpire={handleAuctionTimerExpire} />}
          </div>

          <SellerStartModal
            open={showSellerStartModal && isSeller && !isStreamLive && !hasStartedThisStream}
            streamTitle={streamTitle}
            isPending={postStartStream.isPending}
            onConfirm={() => {
              void handleSellerStartModalConfirm();
            }}
          />
          <StreamEndModal
            open={showStreamEndModal}
            isPending={postEndStream.isPending}
            hasRemainingItems={hasPendingAuctionItems}
            onClose={() => setShowStreamEndModal(false)}
            onConfirm={() => {
              void handleStreamEndConfirm();
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
              onClose={clearWinnerInfo}
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
              initialSeconds={300}
              onTimeout={markStreamEnded}
              onExit={() => {
                navigate('/main');
              }}
            />
          )}
          {streamState === 'ended' && (
            <StreamEnded
              onClose={() => {
                navigate('/main');
              }}
            />
          )}
        </div>
        <AnimatePresence initial={false}>
          {isChatOpen && (
            <motion.div
              key="right-panel"
              className="min-w-0 overflow-hidden rounded-2xl"
              initial={CHAT_PANEL_INITIAL}
              animate={CHAT_PANEL_ANIMATE}
              exit={CHAT_PANEL_INITIAL}
              transition={CHAT_PANEL_TRANSITION}
            >
              <RightPanel
                isSeller={isSeller}
                auctionType={activeAuctionType}
                auctionStatistics={auctionStatistics}
                uniqueBidSync={uniqueBidSync}
                streamEnter={activeStreamEnter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
