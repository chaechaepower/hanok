import { useState } from 'react';

import AuctionTimer from '@/components/Live/Auction/shared/AuctionTimer';
import AuctionCommentToast from '@/components/Live/Stream/AuctionCommentToast';
import BuyerControlBar from '@/components/Live/Stream/BuyerControlBar';
import SellerControlBar from '@/components/Live/Stream/SellerControlBar';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import StreamDisconnected from '@/components/Live/Stream/Streamdisconnected';
import StreamEnded from '@/components/Live/Stream/StreamEnded';
import WinModal from '@/components/Live/Auction/Buyer/WinModal';
import UniqueAuctionResultModal from '@/components/Live/Auction/Buyer/UniqueAuctionResultModal';
import AuctionPanel from '@/components/Live/Auction/shared/AuctionPanel';
import ChatPanel from '@/components/Live/Chat/ChatPanel';
import { useStompChat } from '@/hooks/useStompChat';

import LeftPanel from '../LeftPanel';
import LiveHeader from '../LiveHeader';
import SellerStartModal from '../SellerStartModal';
import StreamEndModal from '../StreamEndModal';
import type { LiveLayoutProps } from './types';

type TabletTab = 'items' | 'chat' | 'auction';

export default function TabletLayout({ stream, auction, livekit, modal, navigate }: LiveLayoutProps) {
  const { videoRef, bgVideoRef, livekitState, viewerCount, toggleMic, toggleCamera, toggleRemoteAudio, isMicOn, isCameraOn, isRemoteAudioMuted } = livekit;
  const [activeTab, setActiveTab] = useState<TabletTab>('chat');
  const { messages, sendMessage, sendMacro, connectionState } = useStompChat(stream.activeStreamEnter?.category ?? '');

  const currentUserId = (() => {
    const stored = localStorage.getItem('userId');
    const parsed = stored ? Number(stored) : NaN;
    return Number.isNaN(parsed) ? null : parsed;
  })();

  const tabs: Array<{ key: TabletTab; label: string }> = [
    { key: 'items', label: '물품' },
    { key: 'chat', label: '채팅' },
    { key: 'auction', label: '경매 현황' },
  ];

  return (
    <div className="flex h-screen w-full min-w-[375px] flex-col bg-surface p-2 text-[14px]">
      <LiveHeader
        streamTitle={stream.streamTitle}
        isLive={stream.isStreamLive}
        startedAt={stream.liveStartedAt ?? stream.activeStreamEnter?.createdAt ?? null}
        showEndButton={stream.isSeller && stream.isStreamLive}
        isEndDisabled={auction.isAuctionInProgress}
        isEnding={modal.postEndStreamIsPending}
        onEndStream={modal.handleOpenStreamEndModal}
        compact
      />

      <div className="flex min-h-0 flex-1 gap-2">
        <div className="flex min-w-0 flex-[2] flex-col gap-2">
          <div
            className={`relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-background transition-shadow duration-500 ${
              auction.liveAuctionItem
                ? 'shadow-[0_0_24px_rgba(166,61,46,0.4)]'
                : auction.introducingAuctionItem
                  ? 'shadow-[0_0_24px_rgba(240,230,216,0.25)]'
                  : ''
            }`}
          >
            <StreamOverlay viewerCount={viewerCount} isSeller={stream.isSeller} />
            {stream.isSeller && <SellerGuideOverlay />}
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

            {auction.auctionComment && (
              <AuctionCommentToast key={auction.auctionComment.id} message={auction.auctionComment.message} />
            )}

            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
              {stream.isSeller && auction.timer && (
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
            {modal.uniqueAuctionResult && (
              <UniqueAuctionResultModal
                isOpen
                itemName={modal.uniqueAuctionResult.itemName}
                payload={modal.uniqueAuctionResult.payload}
                winnerInfo={modal.uniqueAuctionResult.winnerInfo}
                onClose={modal.handleUniqueAuctionResultClose}
              />
            )}
            {stream.streamState === 'disconnected' && (
              <StreamDisconnected initialSeconds={300} onTimeout={modal.markStreamEnded} onExit={() => navigate('/main')} />
            )}
            {stream.streamState === 'ended' && <StreamEnded onClose={() => navigate('/main')} />}
          </div>

          <div className="shrink-0 rounded-2xl bg-background p-2">
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
              />
            ) : (
              <BuyerControlBar
                variant="inline"
                showChatToggle={false}
                auctionType={auction.activeAuctionType}
                bidSync={auction.bidSync}
                uniqueBidSync={auction.uniqueBidSync}
                activeAuctionId={auction.activeBidAuctionId}
                isRemoteAudioMuted={isRemoteAudioMuted}
                onToggleMute={toggleRemoteAudio}
              />
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background">
          <div className="flex shrink-0 border-b border-neutral-800" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`flex-1 py-3 text-sm font-bold transition ${
                  activeTab === tab.key ? 'border-b-2 border-gold text-neutral-100' : 'text-neutral-500'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
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
            {activeTab === 'auction' && (
              <AuctionPanel
                isSeller={stream.isSeller}
                auctionType={auction.activeAuctionType}
                auctionStatistics={auction.auctionStatistics}
                uniqueBidSync={auction.uniqueBidSync}
                currentUserId={currentUserId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
