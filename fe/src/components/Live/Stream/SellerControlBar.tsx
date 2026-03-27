import { useCallback, useState, type RefObject } from 'react';
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
  introduceAuctionId?: number | null;
  startAuctionId?: number | null;
  startAuctionType?: LiveAuctionType | null;
  canIntroduce: boolean;
  canStart: boolean;
  readyItems?: ReadyItem[];
  selectedAuctionId?: number | null;
  onSelectAuctionItem?: (id: number | null) => void;
  toggleMic?: () => void;
  toggleCamera?: () => void;
  isMicOn?: boolean;
  isCameraOn?: boolean;
  variant?: ControlBarVariant;
  onIntroduce?: () => void;
  onStart?: () => void;
  micLevel?: number;
  introduceButtonRef?: RefObject<HTMLButtonElement | null>;
  startButtonRef?: RefObject<HTMLButtonElement | null>;
  introduceButtonClassName?: string;
  startButtonClassName?: string;
}

export default function SellerControlBar({
  introduceAuctionId = null,
  startAuctionId = null,
  startAuctionType = null,
  canIntroduce,
  canStart,
  readyItems = [],
  selectedAuctionId = null,
  onSelectAuctionItem,
  toggleMic,
  toggleCamera,
  isMicOn = true,
  isCameraOn = true,
  variant = 'overlay',
  onIntroduce,
  onStart,
  introduceButtonRef,
  startButtonRef,
  introduceButtonClassName,
  startButtonClassName,
  micLevel,
}: Props) {
  const [guideOpen, setGuideOpen] = useState(false);
  const { id: streamId } = useParams<{ id: string }>();

  const handleAuctionStart = useCallback(() => {
    if (onStart) {
      onStart();
      return;
    }

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
  }, [onStart, streamId, startAuctionId, startAuctionType]);

  const handleAuctionItemIntroduce = useCallback(() => {
    if (onIntroduce) {
      onIntroduce();
      return;
    }

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
  }, [onIntroduce, streamId, introduceAuctionId]);

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
          onSelectAuctionItem?.(readyItems[prevIndex].auctionId);
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          if (readyItems.length === 0) break;
          const currentIndex = readyItems.findIndex((item) => item.auctionId === selectedAuctionId);
          const nextIndex = currentIndex < 0 || currentIndex >= readyItems.length - 1 ? 0 : currentIndex + 1;
          onSelectAuctionItem?.(readyItems[nextIndex].auctionId);
          break;
        }
      }
    },
    [canIntroduce, canStart, handleAuctionItemIntroduce, handleAuctionStart, readyItems, selectedAuctionId, onSelectAuctionItem],
  );

  const activeKeys = useKeyboardShortcuts(handleKeyAction);

  return (
    <div className={`${variant === 'overlay' ? 'absolute bottom-4 left-3 right-3' : ''} flex flex-col gap-2`}>
      {micLevel != null && (
        <div className="flex justify-end px-1">
          <div className="flex items-end gap-[4px] rounded-xl bg-surface/80 px-3 py-2 backdrop-blur-md">
            {Array.from({ length: 5 }, (_, i) => {
              const threshold = (i + 1) / 5;
              const isActive = isMicOn && (micLevel ?? 0) >= threshold * 0.6;
              const h = 4 + i * 3;
              const color = isActive
                ? i < 1 ? 'bg-accent' : i < 3 ? 'bg-gold' : 'bg-ember'
                : 'bg-neutral-700';
              return <div key={i} className={`w-[3px] rounded-full transition-all duration-75 ${color}`} style={{ height: `${h}px` }} />;
            })}
          </div>
        </div>
      )}
      <div className="flex items-stretch justify-between">
      {/* 좌하단: 키보드 가이드 */}
      <KeyboardGuide variant="seller" open={guideOpen} onToggle={setGuideOpen} activeKeys={activeKeys} placement={variant === 'inline' ? 'top' : 'left'} />

      {/* 하단 중앙: 액션 버튼 */}
      <div className="flex flex-1 items-center justify-center flex-col gap-2 px-2.5">
        <SellerActionButtons
          onIntroduce={handleAuctionItemIntroduce}
          onStart={handleAuctionStart}
          canIntroduce={canIntroduce}
          canStart={canStart}
          introduceButtonRef={introduceButtonRef}
          startButtonRef={startButtonRef}
          introduceButtonClassName={introduceButtonClassName}
          startButtonClassName={startButtonClassName}
        />
      </div>

      {/* 우하단: 미디어 컨트롤 */}
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface/80 px-3">
        <button
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-warm/10 ${!isMicOn ? 'text-accent' : 'text-neutral-400 hover:text-neutral-200'}`}
          onClick={toggleMic}
        >
          {!isMicOn ? <LuMicOff size={22} /> : <LuMic size={22} />}
        </button>
        <button
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-warm/10 ${!isCameraOn ? 'text-accent' : 'text-neutral-400 hover:text-neutral-200'}`}
          onClick={toggleCamera}
        >
          {!isCameraOn ? <LuVideoOff size={22} /> : <LuVideo size={22} />}
        </button>
      </div>
      </div>
    </div>
  );
}
