import { useEffect, useState } from 'react';
import { GoHomeFill } from 'react-icons/go';
import { useNavigate, useParams } from 'react-router-dom';

import WinModal from '@/components/Live/Auction/Buyer/WinModal';
import AuctionTimer from '@/components/Live/Auction/shared/AuctionTimer';
import ControlBar from '@/components/Live/Stream/ControlBar';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import type { BidWinnerPayload, StreamTimerPayload, SyncedAuctionTimer } from '@/types';
import type { AuctionStatisticsPayload } from '@/types';
import { disconnectStompClient, subscribeStream } from '@/websocket/stompClient';

import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

type BroadcastStreamEvent =
  | {
      eventType: 'AUCTION_START';
      payload?: {
        item?: {
          name?: string;
          condition?: string;
        };
        timer?: StreamTimerPayload;
      };
    }
  | {
      eventType: 'BID_PLACED';
      payload?: {
        snipingTimer?: StreamTimerPayload | null;
      };
    }
  | {
      eventType: 'AUCTION_STATISTICS';
      payload?: AuctionStatisticsPayload;
    }
  | {
      eventType: string;
      payload?: unknown;
    };

type PrivateStreamEvent =
  | {
      eventType: 'BID_WINNER';
      payload?: BidWinnerPayload;
    }
  | {
      eventType: string;
      payload?: unknown;
    };

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

const isBidWinnerEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'BID_WINNER' }> => event.eventType === 'BID_WINNER';

const createSyncedTimer = (timer: StreamTimerPayload): SyncedAuctionTimer => ({
  ...timer,
  receivedAtMs: Date.now(),
});

export default function LivePage() {
  const navigate = useNavigate();
  const { id: streamId } = useParams<{ id: string }>();
  const [isSeller, setIsSeller] = useState(true);
  const [timer, setTimer] = useState<SyncedAuctionTimer | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<BidWinnerPayload | null>(null);
  const [currentItemCond, setCurrentItemCond] = useState('');
  const [auctionStatistics, setAuctionStatistics] = useState<AuctionStatisticsPayload | null>(null);

  useEffect(() => {
    if (!streamId) {
      return;
    }

    const handleBroadcastEvent = (event: BroadcastStreamEvent) => {
      if (isAuctionStartEvent(event) && event.payload?.timer) {
        setTimer(createSyncedTimer(event.payload.timer));
        setCurrentItemCond(event.payload.item?.condition ?? '');
        setWinnerInfo(null);
        return;
      }

      if (isBidPlacedEvent(event) && event.payload?.snipingTimer) {
        setTimer(createSyncedTimer(event.payload.snipingTimer));
        return;
      }

      if (isAuctionStatisticsEvent(event) && event.payload) {
        setAuctionStatistics(event.payload);
      }
    };

    const handlePrivateEvent = (event: PrivateStreamEvent) => {
      if (isBidWinnerEvent(event) && event.payload) {
        setWinnerInfo(event.payload);
      }
    };

    let unsubscribeStream: () => void = () => {};

    void subscribeStream<BroadcastStreamEvent, PrivateStreamEvent>({
      streamId,
      onBroadcast: handleBroadcastEvent,
      onPrivate: handlePrivateEvent,
    })
      .then((cleanup) => {
        unsubscribeStream = cleanup;
      })
      .catch((error) => {
        console.error('[stream] failed to subscribe', error);
      });

    return () => {
      unsubscribeStream();
      void disconnectStompClient();
    };
  }, [streamId]);

  const handleWinConfirm = async () => {
    await Promise.resolve();
    setWinnerInfo(null);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-black p-3">
      <div className="mb-2 flex shrink-0 items-center">
        <button
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#71717A] transition hover:bg-[rgba(255,255,255,0.05)] hover:text-[#A1A1AA]"
          onClick={() => navigate('/')}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <GoHomeFill /> 홈으로
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-w-0 flex-1">
          <LeftPanel isSeller={isSeller} />
        </div>
        <div className="relative min-w-0 flex-2 overflow-hidden rounded-2xl bg-background">
          <StreamOverlay />
          <SellerGuideOverlay />
          <StreamPlaceholder />
          <ControlBar isSeller={isSeller} />

          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            <div className="flex gap-1 rounded-lg bg-[rgba(0,0,0,.6)] p-1">
              <button
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${isSeller ? 'bg-white text-black' : 'text-[#71717a]'}`}
                onClick={() => setIsSeller(true)}
              >
                판매자
              </button>
              <button
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${!isSeller ? 'bg-white text-black' : 'text-[#71717a]'}`}
                onClick={() => setIsSeller(false)}
              >
                구매자
              </button>
            </div>

            {timer && <AuctionTimer key={timer.receivedAtMs} timer={timer} onExpire={() => undefined} />}
          </div>

          {winnerInfo && (
            <WinModal
              isOpen
              itemName={winnerInfo.item.itemName}
              itemCond={currentItemCond || '경매 종료 상품'}
              finalPrice={winnerInfo.item.finalPrice}
              address={winnerInfo.shipping}
              onConfirm={handleWinConfirm}
              onClose={() => setWinnerInfo(null)}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <RightPanel isSeller={isSeller} auctionStatistics={auctionStatistics} />
        </div>
      </div>
    </div>
  );
}
