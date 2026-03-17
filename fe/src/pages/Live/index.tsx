import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { useGetStreamEnter } from '@/api/hooks/useGetStreamEnter';
import { useStompViewerCount } from '@/hooks/useStompViewerCount';
import { useLiveKit } from '@/hooks/useLiveKit';
import { useLiveStream } from '@/hooks/useLiveStream';
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
import type { StreamEnterResponse, StreamRequest } from '@/types';

import LeftPanel from './LeftPanel';
import LiveHeader from './LiveHeader';
import RightPanel from './RightPanel';
import SellerStartModal from './SellerStartModal';

export default function LivePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { id: streamId } = useParams<{ id: string }>();
  const numericStreamId = Number(streamId);
  const shouldAutoOpenStartModal =
    (location.state as { autoOpenStartModal?: boolean } | null)?.autoOpenStartModal === true;
  const { data: streamEnter } = useGetStreamEnter(numericStreamId);
  const { viewerCount } = useStompViewerCount();
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [showSellerStartModal, setShowSellerStartModal] = useState(false);
  const autoOpenedStartModalStreamIdRef = useRef<number | null>(null);
  const postStartStream = usePostStartStream();

  const activeStreamEnter: StreamEnterResponse | null = streamEnter ?? null;
  const isSeller = activeStreamEnter?.isHost ?? false;

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
  } = useLiveStream(streamId, Boolean(activeStreamEnter?.isLive));

  const readyItems = itemSync?.items.filter((item) => item.auctionStatus === 'READY') ?? [];
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
      confirmStreamStart();
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

  const handleWinConfirm = async () => {
    await Promise.resolve();
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    clearWinnerInfo();
  };

  const handleUniqueAuctionResultClose = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    clearUniqueAuctionResult();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-surface p-3">
      <LiveHeader streamTitle={streamTitle} isLive={isStreamLive} startedAt={liveStartedAt ?? activeStreamEnter?.createdAt ?? null} />

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
              initialSeconds={30}
              onTimeout={markStreamEnded}
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
