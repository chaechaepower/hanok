import { AnimatePresence, motion } from 'framer-motion';

import AuctionTimer from '@/components/Live/Auction/shared/AuctionTimer';
import AuctionCommentToast from '@/components/Live/Stream/AuctionCommentToast';
import BuyerControlBar from '@/components/Live/Stream/BuyerControlBar';
import SellerControlBar from '@/components/Live/Stream/SellerControlBar';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';
import SellerUniqueBidOverlay from '@/components/Live/Stream/SellerUniqueBidOverlay';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import StreamDisconnected from '@/components/Live/Stream/Streamdisconnected';
import StreamEnded from '@/components/Live/Stream/StreamEnded';
import SellerUniqueAuctionResultModal from '@/components/Live/Auction/Buyer/SellerUniqueAuctionResultModal';
import WinModal from '@/components/Live/Auction/Buyer/WinModal';
import UniqueAuctionResultModal from '@/components/Live/Auction/Buyer/UniqueAuctionResultModal';

import LeftPanel from '../LeftPanel';
import LiveHeader from '../LiveHeader';
import RightPanel from '../RightPanel';
import SellerStartModal from '../SellerStartModal';
import StreamEndModal from '../StreamEndModal';
import { getPausedInitialSeconds } from './getPausedInitialSeconds';
import type { LiveLayoutProps } from './types';

const CHAT_PANEL_INITIAL = { flex: 0, opacity: 0 };
const CHAT_PANEL_ANIMATE = { flex: 1, opacity: 1 };
const CHAT_PANEL_TRANSITION = { type: 'spring', stiffness: 400, damping: 30 } as const;

export default function DesktopLayout({ stream, auction, livekit, chat, modal, navigate }: LiveLayoutProps) {
  const {
    videoRef,
    bgVideoRef,
    livekitState,
    viewerCount,
    toggleMic,
    toggleCamera,
    toggleRemoteAudio,
    isMicOn,
    isCameraOn,
    isRemoteAudioMuted,
  } = livekit;
  const pausedInitialSeconds = getPausedInitialSeconds(stream.activeStreamEnter);

  return (
    <div className="flex h-screen w-full flex-col bg-surface p-3">
      <LiveHeader
        streamTitle={stream.streamTitle}
        isLive={stream.isStreamLive}
        startedAt={stream.liveStartedAt ?? stream.activeStreamEnter?.createdAt ?? null}
        showEndButton={stream.isSeller && stream.isStreamLive}
        isEndDisabled={auction.isAuctionInProgress}
        isEnding={modal.postEndStreamIsPending}
        onEndStream={modal.handleOpenStreamEndModal}
      />

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-3xl">
          <LeftPanel
            isSeller={stream.isSeller}
            syncedItems={auction.itemSync?.items ?? null}
            selectedAuctionId={auction.visibleSelectedAuctionId}
            onSelectAuctionItem={auction.setSelectedAuctionId}
          />
        </div>
        <div
          className={`relative min-w-0 flex-2 overflow-hidden rounded-3xl bg-background transition-shadow duration-500 ${
            auction.liveAuctionItem
              ? 'shadow-[0_0_24px_rgba(166,61,46,0.4)]'
              : auction.introducingAuctionItem
                ? 'shadow-[0_0_24px_rgba(240,230,216,0.25)]'
                : ''
          }`}
        >
          <StreamOverlay viewerCount={viewerCount} isSeller={stream.isSeller} />
          {stream.isSeller && <SellerGuideOverlay />}
          {auction.activeAuctionType === 'UNIQUE_TOP' && auction.uniqueBidSync && (
            <SellerUniqueBidOverlay participantCount={auction.uniqueBidSync.participantCount} />
          )}
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
          {stream.isSeller ? (
            <SellerControlBar
              introduceAuctionId={auction.introduceAuctionId}
              startAuctionId={auction.startAuctionId}
              startAuctionType={auction.startAuctionType}
              canIntroduce={auction.canIntroduceAuction}
              canStart={auction.canStartAuction}
              readyItems={auction.readyItems}
              selectedAuctionId={auction.selectedAuctionId}
              onSelectAuctionItem={auction.setSelectedAuctionId}
              toggleMic={toggleMic}
              toggleCamera={toggleCamera}
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
            />
          ) : (
            <BuyerControlBar
              auctionType={auction.activeAuctionType}
              bidSync={auction.bidSync}
              uniqueBidSync={auction.uniqueBidSync}
              activeAuctionId={auction.activeBidAuctionId}
              isRemoteAudioMuted={isRemoteAudioMuted}
              onToggleMute={toggleRemoteAudio}
              onToggleChat={chat.handleToggleChat}
            />
          )}

          {auction.auctionComment && (
            <AuctionCommentToast key={auction.auctionComment.id} message={auction.auctionComment.message} />
          )}

          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {auction.timer && (
              <AuctionTimer
                key={auction.timer.receivedAtMs}
                timer={auction.timer}
                onExpire={auction.handleAuctionTimerExpire}
              />
            )}
          </div>

          <SellerStartModal
            open={modal.showSellerStartModal && stream.isSeller && !stream.isStreamLive && !modal.hasStartedThisStream}
            streamTitle={stream.streamTitle}
            isPending={modal.postStartStreamIsPending}
            onConfirm={modal.handleSellerStartModalConfirm}
          />
          <StreamEndModal
            open={modal.showStreamEndModal}
            isPending={modal.postEndStreamIsPending}
            hasRemainingItems={auction.hasPendingAuctionItems}
            onClose={() => modal.setShowStreamEndModal(false)}
            onConfirm={modal.handleStreamEndConfirm}
          />
          {!modal.uniqueAuctionResult && modal.winnerInfo && (
            <WinModal
              isOpen
              itemName={modal.winnerInfo.payload.item.itemName}
              itemCond={modal.winnerInfo.itemCond || 'Auction item'}
              finalPrice={modal.winnerInfo.payload.item.finalPrice}
              address={modal.winnerInfo.payload.shipping}
              onConfirm={modal.handleWinConfirm}
              onClose={modal.clearWinnerInfo}
            />
          )}
          {modal.uniqueAuctionResult &&
            (stream.isSeller ? (
              <SellerUniqueAuctionResultModal
                isOpen
                itemName={modal.uniqueAuctionResult.itemName}
                payload={modal.uniqueAuctionResult.payload}
                onClose={modal.handleUniqueAuctionResultClose}
              />
            ) : (
              <UniqueAuctionResultModal
                isOpen
                itemName={modal.uniqueAuctionResult.itemName}
                payload={modal.uniqueAuctionResult.payload}
                winnerInfo={modal.uniqueAuctionResult.winnerInfo}
                onClose={modal.handleUniqueAuctionResultClose}
              />
            ))}
          {stream.streamState === 'disconnected' && (
            <StreamDisconnected
              initialSeconds={pausedInitialSeconds}
              onTimeout={modal.markStreamEnded}
              onExit={() => navigate('/main')}
            />
          )}
          {stream.streamState === 'ended' && <StreamEnded onClose={() => navigate('/main')} />}
        </div>
        <AnimatePresence initial={false}>
          {chat.isChatOpen && (
            <motion.div
              key="right-panel"
              className="min-w-0 overflow-hidden rounded-3xl"
              initial={CHAT_PANEL_INITIAL}
              animate={CHAT_PANEL_ANIMATE}
              exit={CHAT_PANEL_INITIAL}
              transition={CHAT_PANEL_TRANSITION}
            >
              <RightPanel
                isSeller={stream.isSeller}
                auctionType={auction.activeAuctionType}
                auctionStatistics={auction.auctionStatistics}
                uniqueBidSync={auction.uniqueBidSync}
                streamEnter={stream.activeStreamEnter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
