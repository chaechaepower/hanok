import { useCallback, useRef, useState } from 'react';
import { IoChatbubbleOutline, IoClose } from 'react-icons/io5';
import { AnimatePresence, motion } from 'framer-motion';

import AuctionPanel from '@/components/Live/Auction/shared/AuctionPanel';
import LiveAuctionTimer from '@/components/Live/Auction/shared/LiveAuctionTimer';
import ChatPanel from '@/components/Live/Chat/ChatPanel';
import BuyerControlBar from '@/components/Live/Stream/BuyerControlBar';
import LiveBidPriceBadge from '@/components/Live/Stream/LiveBidPriceBadge';
import LiveMobileAuctionCommentToast from '@/components/Live/Stream/LiveMobileAuctionCommentToast';
import LiveSellerUniqueBidOverlay from '@/components/Live/Stream/LiveSellerUniqueBidOverlay';
import SellerControlBar from '@/components/Live/Stream/SellerControlBar';
import StreamDisconnected from '@/components/Live/Stream/Streamdisconnected';
import StreamEnded from '@/components/Live/Stream/StreamEnded';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import SellerUniqueAuctionResultModal from '@/components/Live/Auction/Buyer/SellerUniqueAuctionResultModal';
import WinModal from '@/components/Live/Auction/Buyer/WinModal';
import UniqueAuctionResultModal from '@/components/Live/Auction/Buyer/UniqueAuctionResultModal';
import { useLiveKitContext } from '@/hooks/liveKitContext';
import { useStompChat } from '@/hooks/useStompChat';

import LeftPanel from '../LeftPanel';
import LiveHeader from '../LiveHeader';
import SellerStartModal from '../SellerStartModal';
import StreamEndModal from '../StreamEndModal';
import { getPausedInitialSeconds } from './getPausedInitialSeconds';
import type { LiveLayoutProps } from './types';

const SWIPE_THRESHOLD = 50;

export default function MobileLayout({ stream, auction, modal, navigate }: LiveLayoutProps) {
  const {
    videoRef,
    bgVideoRef,
    state: livekitState,
    viewerCount,
    toggleMic,
    toggleCamera,
    toggleRemoteAudio,
    isMicOn,
    isCameraOn,
    isRemoteAudioMuted,
    micLevel,
  } = useLiveKitContext();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'chat' | 'auction'>('chat');
  const { messages, sendMessage, sendMacro, connectionState } = useStompChat(stream.activeStreamEnter?.category ?? '');
  const pausedInitialSeconds = getPausedInitialSeconds(stream.activeStreamEnter);

  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'items', label: 'è‡¾ì‡³ë­¹' },
    { key: 'chat', label: 'ï§¢ê¾ªë˜¿' },
    { key: 'auction', label: 'å¯ƒìŽˆâ„“ ?ê¾ªì†´' },
  ];

  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (diff < -SWIPE_THRESHOLD && !isPanelVisible) {
        setIsPanelVisible(true);
      } else if (diff > SWIPE_THRESHOLD && isPanelVisible) {
        setIsPanelVisible(false);
      }
    },
    [isPanelVisible],
  );

  return (
    <div
      className="relative flex h-screen w-full min-w-[375px] flex-col bg-surface p-3 text-[13px]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="shrink-0">
        <LiveHeader
          streamTitle={stream.streamTitle}
          isLive={stream.isStreamLive}
          startedAt={stream.liveStartedAt ?? stream.activeStreamEnter?.createdAt ?? null}
          isSeller={stream.isSeller}
          showEndButton={stream.isSeller && stream.isStreamLive}
          isEndDisabled={auction.isAuctionInProgress}
          isEnding={modal.postEndStreamIsPending}
          onEndStream={modal.handleOpenStreamEndModal}
          compact
        />
      </div>

      <div className="min-h-0 flex-1 py-1">
        <div
          className={`relative h-full overflow-hidden rounded-2xl bg-background transition-shadow duration-500 ${
            auction.liveAuctionItem
              ? 'shadow-[0_0_24px_rgba(166,61,46,0.4)]'
              : auction.introducingAuctionItem
                ? 'shadow-[0_0_24px_rgba(240,230,216,0.25)]'
                : ''
          }`}
        >
          <StreamOverlay viewerCount={viewerCount} isSeller={stream.isSeller} />
          <LiveSellerUniqueBidOverlay auctionType={auction.activeAuctionType} />
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

          <LiveMobileAuctionCommentToast />
          <LiveBidPriceBadge visible={auction.liveAuctionItem !== null} />

          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {stream.isSeller && <LiveAuctionTimer onExpire={auction.handleAuctionTimerExpire} />}
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
      </div>

      <div className="relative mt-2 shrink-0 rounded-2xl bg-background px-2 py-2">
        {!isPanelVisible && (
          <button
            type="button"
            onClick={() => setIsPanelVisible(true)}
            className="absolute -top-15 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-gold/90 text-background shadow-lg transition hover:bg-gold"
          >
            <IoChatbubbleOutline size={18} />
          </button>
        )}
        {stream.isSeller ? (
          <SellerControlBar
            variant="inline"
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
            micLevel={micLevel}
          />
        ) : (
          <BuyerControlBar
            variant="inline"
            showChatToggle={false}
            auctionType={auction.activeAuctionType}
            activeAuctionId={auction.activeBidAuctionId}
            isRemoteAudioMuted={isRemoteAudioMuted}
            onToggleMute={toggleRemoteAudio}
          />
        )}
      </div>

      <AnimatePresence>
        {isPanelVisible && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-sm"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-2">
              <div className="flex gap-1" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === tab.key ? 'bg-gold/15 text-gold' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsPanelVisible(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
              >
                <IoClose size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'items' && (
                <LeftPanel
                  isSeller={stream.isSeller}
                  syncedItems={auction.itemSync?.items ?? null}
                  selectedAuctionId={auction.visibleSelectedAuctionId}
                  onSelectAuctionItem={auction.setSelectedAuctionId}
                />
              )}
              {activeTab === 'chat' && (
                <ChatPanel
                  streamId={stream.activeStreamEnter?.streamId ?? 0}
                  category={stream.activeStreamEnter?.category ?? ''}
                  notice={stream.activeStreamEnter?.notice ?? null}
                  messages={messages}
                  connectionState={connectionState}
                  onSendMessage={sendMessage}
                  onSendMacro={sendMacro}
                />
              )}
              {activeTab === 'auction' && <AuctionPanel isSeller={stream.isSeller} auctionType={auction.activeAuctionType} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
