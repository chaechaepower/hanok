import { useCallback, useState } from 'react';
import { LuMic, LuMicOff, LuVideo, LuVideoOff } from 'react-icons/lu';
import KeyboardGuide from '@/components/Live/Auction/shared/KeyboardGuide';
import SellerActionButtons from '@/components/Live/Stream/SellerActionButtons';
import type { LiveAuctionType } from '@/types';
import { useParams } from 'react-router-dom';
import { sendStreamMessage } from '@/websocket/stompClient';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export interface ReadyItem {
  auctionId: number;
  auctionStatus: string;
}

export type ControlBarVariant = 'overlay' | 'inline';

interface Props {
  introduceAuctionId: number | null;
  startAuctionId: number | null;
  startAuctionType: LiveAuctionType | null;
  canIntroduce: boolean;
  canStart: boolean;
  readyItems: ReadyItem[];
  selectedAuctionId: number | null;
  onSelectAuctionItem: (id: number | null) => void;
  toggleMic?: () => void;
  toggleCamera?: () => void;
  isMicOn?: boolean;
  isCameraOn?: boolean;
  variant?: ControlBarVariant;
}

export default function SellerControlBar({
  introduceAuctionId,
  startAuctionId,
  startAuctionType,
  canIntroduce,
  canStart,
  readyItems,
  selectedAuctionId,
  onSelectAuctionItem,
  toggleMic,
  toggleCamera,
  isMicOn = true,
  isCameraOn = true,
  variant = 'overlay',
}: Props) {
  const [guideOpen, setGuideOpen] = useState(false);
  const { id: streamId } = useParams<{ id: string }>();

  const handleAuctionStart = useCallback(() => {
    if (!streamId) {
      console.error('[stream] missing streamId for AUCTION_START');
      return;
    }

    if (startAuctionId === null) {
      console.error('[stream] missing auctionId for AUCTION_START');
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: startAuctionType === 'UNIQUE_TOP' ? 'UNIQUE_AUCTION_START' : 'AUCTION_START',
      payload: {
        auctionId: startAuctionId,
      },
    }).catch((error) => {
      console.error('[stream] failed to send AUCTION_START', error);
    });
  }, [streamId, startAuctionId, startAuctionType]);

  const handleAuctionItemIntroduce = useCallback(() => {
    if (!streamId) {
      console.error('[stream] missing streamId for ITEM_INTRODUCE');
      return;
    }

    if (introduceAuctionId === null) {
      console.error('[stream] missing auctionId for ITEM_INTRODUCE');
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: 'ITEM_INTRODUCE',
      payload: {
        auctionId: introduceAuctionId,
      },
    }).catch((error) => {
      console.error('[stream] failed to send ITEM_INTRODUCE', error);
    });
  }, [streamId, introduceAuctionId]);

  const handleKeyAction = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
          event.preventDefault();
          if (canIntroduce) handleAuctionItemIntroduce();
          break;
        case 'Enter':
          event.preventDefault();
          if (canStart) handleAuctionStart();
          break;
        case 'ArrowUp': {
          event.preventDefault();
          if (readyItems.length === 0) break;
          const currentIndex = readyItems.findIndex((item) => item.auctionId === selectedAuctionId);
          const prevIndex = currentIndex <= 0 ? readyItems.length - 1 : currentIndex - 1;
          onSelectAuctionItem(readyItems[prevIndex].auctionId);
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          if (readyItems.length === 0) break;
          const currentIndex = readyItems.findIndex((item) => item.auctionId === selectedAuctionId);
          const nextIndex = currentIndex < 0 || currentIndex >= readyItems.length - 1 ? 0 : currentIndex + 1;
          onSelectAuctionItem(readyItems[nextIndex].auctionId);
          break;
        }
      }
    },
    [canIntroduce, canStart, handleAuctionItemIntroduce, handleAuctionStart, readyItems, selectedAuctionId, onSelectAuctionItem],
  );

  const activeKeys = useKeyboardShortcuts(handleKeyAction);

  return (
    <div className={`${variant === 'overlay' ? 'absolute bottom-3 left-3 right-3' : ''} flex items-stretch justify-between`}>
      {/* 좌하단: 키보드 가이드 */}
      <KeyboardGuide variant="seller" open={guideOpen} onToggle={setGuideOpen} activeKeys={activeKeys} placement={variant === 'inline' ? 'top' : 'left'} />

      {/* 하단 중앙: 액션 버튼 */}
      <div className="flex flex-1 items-center flex-col gap-2 px-2.5">
        <SellerActionButtons
          onIntroduce={handleAuctionItemIntroduce}
          onStart={handleAuctionStart}
          canIntroduce={canIntroduce}
          canStart={canStart}
        />
      </div>

      {/* 우하단: 미디어 컨트롤 */}
      <div className="flex flex-col justify-center gap-3 rounded-2xl bg-surface/80 px-2.5">
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-warm/10 ${!isMicOn ? 'text-accent' : 'text-neutral-400 hover:text-neutral-200'}`}
          onClick={toggleMic}
        >
          {!isMicOn ? <LuMicOff size={18} /> : <LuMic size={18} />}
        </button>
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-warm/10 ${!isCameraOn ? 'text-accent' : 'text-neutral-400 hover:text-neutral-200'}`}
          onClick={toggleCamera}
        >
          {!isCameraOn ? <LuVideoOff size={18} /> : <LuVideo size={18} />}
        </button>
      </div>
    </div>
  );
}
