import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { usePostEndStream } from '@/api/hooks/usePostEndStream';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { useGetStreamEnter } from '@/api/hooks/useGetStreamEnter';
import { useLiveKit } from '@/hooks/useLiveKit';
import { useLiveStream } from '@/hooks/useLiveStream';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { StreamRequest } from '@/types';
import { sendStreamMessage } from '@/websocket/stompClient';

import LiveFallback from './LiveFallback';
import DesktopLayout from './layouts/DesktopLayout';
import TabletLayout from './layouts/TabletLayout';
import MobileLayout from './layouts/MobileLayout';
import type { LiveLayoutProps } from './layouts/types';

const STARTED_STREAM_IDS_STORAGE_KEY = 'startedLiveStreamIds';

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

const isActiveStreamStatus = (status?: string | null) => status === 'LIVE' || status === 'PAUSED';

export default function LivePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { id: streamId } = useParams<{ id: string }>();
  const numericStreamId = Number(streamId);
  const isValidStreamId = Number.isFinite(numericStreamId) && numericStreamId > 0;
  const safeStreamId = isValidStreamId ? streamId : undefined;
  const shouldAutoOpenStartModal =
    (location.state as { autoOpenStartModal?: boolean } | null)?.autoOpenStartModal === true;
  const {
    data: streamEnter,
    error: streamEnterError,
    isError: isStreamEnterError,
    isPending: isStreamEnterPending,
  } = useGetStreamEnter(numericStreamId);
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
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
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
  } = useLiveStream(safeStreamId, isActiveStreamStatus(activeStreamEnter?.status), activeStreamEnter?.status);
  const streamEnterErrorStatus =
    streamEnterError instanceof AxiosError ? (streamEnterError.response?.status ?? null) : null;
  const isNotFoundLive = !isValidStreamId || (isStreamEnterError && streamEnterErrorStatus === 404);
  const isStreamEnterUnavailable = isStreamEnterError && streamEnterErrorStatus !== 404;

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
    micLevel,
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
    clearUniqueAuctionResult();
  };

  const handleUniqueAuctionResultClose = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    clearWinnerInfo();
    clearUniqueAuctionResult();
  };

  const handleAuctionTimerExpire = useCallback(() => {
    if (!isLoggedIn || !streamId || activeAuctionType !== 'UNIQUE_TOP' || activeBidAuctionId === null) {
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
  }, [activeAuctionType, activeBidAuctionId, isLoggedIn, streamId]);

  const breakpoint = useBreakpoint();

  if (isNotFoundLive) {
    return (
      <LiveFallback
        title="존재하지 않는 라이브입니다"
        description={`삭제되었거나 잘못된 주소로 접근했습니다.\n메인 화면에서 현재 진행 중인 라이브를 다시 확인해 주세요.`}
        actionLabel="홈으로"
        onAction={() => navigate('/main')}
      />
    );
  }

  if (!isStreamEnterPending && isStreamEnterUnavailable) {
    return (
      <LiveFallback
        title="라이브 정보를 불러오지 못했습니다"
        description={`잠시 후 다시 시도해 주세요\n문제가 계속되면 홈에서 다시 접근하는 편이 안전합니다.`}
        actionLabel="홈으로"
        onAction={() => navigate('/main')}
      />
    );
  }

  const layoutProps: LiveLayoutProps = {
    stream: {
      streamTitle,
      isSeller,
      isStreamLive,
      streamState,
      liveStartedAt,
      activeStreamEnter,
    },
    auction: {
      selectedAuctionId,
      visibleSelectedAuctionId,
      setSelectedAuctionId,
      liveAuctionItem,
      introducingAuctionItem,
      activeBidAuctionId,
      activeAuctionType,
      isAuctionInProgress,
      hasPendingAuctionItems,
      itemSync,
      bidSync,
      uniqueBidSync,
      auctionStatistics,
      auctionComment,
      timer,
      readyItems,
      introduceAuctionId,
      startAuctionId,
      startAuctionType,
      canIntroduceAuction,
      canStartAuction,
      handleAuctionTimerExpire,
    },
    livekit: {
      livekitState,
      videoRef,
      bgVideoRef,
      viewerCount,
      toggleMic,
      toggleCamera,
      toggleRemoteAudio,
      isMicOn,
      isCameraOn,
      isRemoteAudioMuted,
      micLevel,
    },
    chat: {
      isChatOpen,
      handleToggleChat,
    },
    modal: {
      showSellerStartModal,
      hasStartedThisStream,
      postStartStreamIsPending: postStartStream.isPending,
      handleSellerStartModalConfirm: () => void handleSellerStartModalConfirm(),
      showStreamEndModal,
      postEndStreamIsPending: postEndStream.isPending,
      setShowStreamEndModal,
      handleStreamEndConfirm: () => void handleStreamEndConfirm(),
      handleOpenStreamEndModal,
      winnerInfo,
      uniqueAuctionResult,
      handleWinConfirm: () => handleWinConfirm(),
      clearWinnerInfo,
      handleUniqueAuctionResultClose,
      markStreamEnded,
    },
    navigate,
  };

  const Layout = breakpoint === 'mobile' ? MobileLayout : breakpoint === 'tablet' ? TabletLayout : DesktopLayout;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={breakpoint}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-screen w-full"
      >
        <Layout {...layoutProps} />
      </motion.div>
    </AnimatePresence>
  );
}
