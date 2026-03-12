import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GoHomeFill } from 'react-icons/go';
import { useNavigate, useParams } from 'react-router-dom';

import { useGetStreamEnter } from '@/api/hooks/useGetStreamEnter';
import WinModal from '@/components/Live/Auction/Buyer/WinModal';
import AuctionTimer from '@/components/Live/Auction/shared/AuctionTimer';
import AuctionCommentToast from '@/components/Live/Stream/AuctionCommentToast';
import ControlBar from '@/components/Live/Stream/ControlBar';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import type {
  AuctionCommentPayload,
  BidWinnerPayload,
  ItemSyncPayload,
  StreamTimerPayload,
  SyncedAuctionTimer,
} from '@/types';
import type { AuctionStatisticsPayload } from '@/types';
import type { BidSyncPayload } from '@/types';
import { disconnectStompClient, sendStreamMessage, subscribeStream } from '@/websocket/stompClient';

import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

type BroadcastStreamEvent =
  | {
      eventType: 'AUCTION_START';
      payload?: {
        item?: {
          name?: string;
          condition?: string;
          bidUnit?: number;
          startPrice?: number;
        };
        timer?: StreamTimerPayload;
      };
    }
  | {
      eventType: 'BID_PLACED';
      payload?: {
        bidInfo?: {
          amount?: number;
        };
        snipingTimer?: StreamTimerPayload | null;
      };
    }
  | {
      eventType: 'BID_SYNC';
      payload?: BidSyncPayload | null;
    }
  | {
      eventType: 'AUCTION_STATISTICS';
      payload?: AuctionStatisticsPayload;
    }
  | {
      eventType: 'ITEM_SYNC';
      payload?: ItemSyncPayload | null;
    }
  | {
      eventType: 'ITEM_INTRODUCE';
      payload: null;
    }
  | {
      eventType: 'AUCTION_COMMENT';
      payload?: AuctionCommentPayload | null;
    }
  | {
      eventType: 'AUCTION_END';
      payload: null;
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

const isBidWinnerEvent = (
  event: PrivateStreamEvent,
): event is Extract<PrivateStreamEvent, { eventType: 'BID_WINNER' }> => event.eventType === 'BID_WINNER';

const createSyncedTimer = (timer: StreamTimerPayload): SyncedAuctionTimer => ({
  ...timer,
  receivedAtMs: Date.now(),
});

export default function LivePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: streamId } = useParams<{ id: string }>();
  const numericStreamId = Number(streamId);
  const { data: streamEnter } = useGetStreamEnter(numericStreamId);
  const [isSeller, setIsSeller] = useState(true);
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [timer, setTimer] = useState<SyncedAuctionTimer | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<BidWinnerPayload | null>(null);
  const [currentItemCond, setCurrentItemCond] = useState('');
  const [auctionStatistics, setAuctionStatistics] = useState<AuctionStatisticsPayload | null>(null);
  const [bidSync, setBidSync] = useState<BidSyncPayload | null>(null);
  const [itemSync, setItemSync] = useState<ItemSyncPayload | null>(null);
  const [auctionComment, setAuctionComment] = useState<{ id: number; message: string } | null>(null);
  const readyItems = itemSync?.items.filter((item) => item.auctionStatus === 'READY') ?? [];
  const introducingAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'INTRODUCING') ?? null;
  const liveAuctionItem = itemSync?.items.find((item) => item.auctionStatus === 'LIVE') ?? null;
  const selectedAuctionItem = itemSync?.items.find((item) => item.auctionId === selectedAuctionId) ?? null;
  const visibleSelectedAuctionId =
    selectedAuctionItem && selectedAuctionItem.auctionStatus !== 'SOLD' && selectedAuctionItem.auctionStatus !== 'UNSOLD'
      ? selectedAuctionId
      : null;
  const selectedReadyAuctionItem = selectedAuctionItem?.auctionStatus === 'READY' ? selectedAuctionItem : null;
  const fallbackReadyAuctionItem = readyItems[0] ?? null;
  const introduceAuctionId = selectedReadyAuctionItem?.auctionId ?? fallbackReadyAuctionItem?.auctionId ?? null;
  const startAuctionId = introducingAuctionItem?.auctionId ?? null;
  const activeBidAuctionId = liveAuctionItem?.auctionId ?? introducingAuctionItem?.auctionId ?? null;
  const canIntroduce = liveAuctionItem === null && introducingAuctionItem === null && introduceAuctionId !== null;
  const canStart = liveAuctionItem === null && startAuctionId !== null;

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
    if (!streamId) {
      return;
    }

    const requestItemSync = async () => {
      await sendStreamMessage(streamId, {
        eventType: 'ITEM_SYNC',
        payload: null,
      });
    };

    const handleBroadcastEvent = (event: BroadcastStreamEvent) => {
      if (isAuctionStartEvent(event) && event.payload?.timer) {
        setTimer(createSyncedTimer(event.payload.timer));
        setCurrentItemCond(event.payload.item?.condition ?? '');
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
        return;
      }

      if (isItemSyncEvent(event)) {
        setItemSync(event.payload ?? null);
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

      if (isBidEndEvent(event)) {
        void requestItemSync();
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
      .then(async (cleanup) => {
        unsubscribeStream = cleanup;
        await requestItemSync();
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
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
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
          <LeftPanel
            isSeller={isSeller}
            syncedItems={itemSync?.items ?? null}
            selectedAuctionId={visibleSelectedAuctionId}
            onSelectAuctionItem={setSelectedAuctionId}
          />
        </div>
        <div className="relative min-w-0 flex-2 overflow-hidden rounded-2xl bg-background">
          <StreamOverlay viewerCount={streamEnter?.viewerCount ?? 0} />
          <SellerGuideOverlay />
          <StreamPlaceholder />
          <ControlBar
            isSeller={isSeller}
            bidSync={bidSync}
            activeBidAuctionId={activeBidAuctionId}
            introduceAuctionId={introduceAuctionId}
            startAuctionId={startAuctionId}
            canIntroduce={canIntroduce}
            canStart={canStart}
          />

          {(streamEnter?.notice || auctionComment) && (
            <AuctionCommentToast
              key={auctionComment?.id ?? 'stream-notice'}
              notice={streamEnter?.notice ?? null}
              message={auctionComment?.message ?? null}
            />
          )}

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
          <RightPanel isSeller={isSeller} auctionStatistics={auctionStatistics} streamEnter={streamEnter ?? null} />
        </div>
      </div>
    </div>
  );
}
