import { useCallback, useState } from 'react';
import { IoChatbubbleOutline } from 'react-icons/io5';
import { LuVolume2, LuVolumeOff } from 'react-icons/lu';

import BidAccessModal from '@/components/Live/Auction/Buyer/BidAccessModal';
import CustomBidPanel from '@/components/Live/Auction/Buyer/CustomBidPanel';
import QuickBidPanel from '@/components/Live/Auction/Buyer/QuickBidPanel';
import UniqueBidPanel from '@/components/Live/Auction/Buyer/UniqueBidPanel';
import KeyboardGuide from '@/components/Live/Auction/shared/KeyboardGuide';
import AddressFormModal from '@/components/common/modal/AddressFormModal';
import type { BidSyncPayload, LiveAuctionType, UniqueBidSyncPayload } from '@/types';
import { useBidState, CUSTOM_UNIT_OPTIONS } from '@/hooks/useBidState';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export type ControlBarVariant = 'overlay' | 'inline';

interface Props {
  auctionType: LiveAuctionType | null;
  bidSync: BidSyncPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  activeAuctionId: number | null;
  isRemoteAudioMuted?: boolean;
  onToggleMute?: () => void;
  onToggleChat?: () => void;
  variant?: ControlBarVariant;
  showChatToggle?: boolean;
}

export default function BuyerControlBar({
  auctionType,
  bidSync,
  uniqueBidSync,
  activeAuctionId,
  isRemoteAudioMuted,
  onToggleMute,
  onToggleChat,
  variant = 'overlay',
  showChatToggle = true,
}: Props) {
  const bid = useBidState({ auctionType, bidSync, uniqueBidSync, activeAuctionId });

  const [guideOpen, setGuideOpen] = useState(false);
  const [panelOpacity, setPanelOpacity] = useState(90);
  const panelOpacityProgress = ((panelOpacity - 10) / 80) * 100;

  const handleKeyAction = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Tab':
          if (bid.isUniqueAuction) return;
          event.preventDefault();
          bid.setTab((prev) => (prev === 'quick' ? 'custom' : 'quick'));
          break;
        case 'Enter':
          event.preventDefault();
          if (!bid.isBidDisabled) bid.handleBidPlace();
          break;
        case 'ArrowUp':
          event.preventDefault();
          bid.handleIncrease();
          break;
        case 'ArrowDown':
          event.preventDefault();
          bid.handleDecrease();
          break;
        case 'ArrowLeft': {
          if (bid.isUniqueAuction) return;
          event.preventDefault();
          const currentIndex = CUSTOM_UNIT_OPTIONS.findIndex((option) => option.value === bid.activeCustomUnit);
          const prevIndex = (currentIndex - 1 + CUSTOM_UNIT_OPTIONS.length) % CUSTOM_UNIT_OPTIONS.length;
          bid.setCustomUnit(CUSTOM_UNIT_OPTIONS[prevIndex].value);
          break;
        }
        case 'ArrowRight': {
          if (bid.isUniqueAuction) return;
          event.preventDefault();
          const currentIndex = CUSTOM_UNIT_OPTIONS.findIndex((option) => option.value === bid.activeCustomUnit);
          const nextIndex = (currentIndex + 1) % CUSTOM_UNIT_OPTIONS.length;
          bid.setCustomUnit(CUSTOM_UNIT_OPTIONS[nextIndex].value);
          break;
        }
      }
    },
    [bid],
  );

  const activeKeys = useKeyboardShortcuts(handleKeyAction);

  return (
    <>
      <div className={`${variant === 'overlay' ? 'absolute bottom-3 left-3 right-3' : ''} flex flex-col gap-2`}>
        <div className="flex items-center justify-between">
          <KeyboardGuide variant="buyer" open={guideOpen} onToggle={setGuideOpen} activeKeys={activeKeys} placement={variant === 'inline' ? 'top' : 'left'} />

          <div className="mx-4 flex min-h-32.5 flex-1">
            <div
              className="flex min-h-32.5 flex-1 flex-col gap-2 rounded-2xl bg-surface/80 px-4 py-3"
              style={{ opacity: panelOpacity / 100 }}
            >
              {bid.visibleAuctionEndPhase !== null ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  {bid.visibleAuctionEndPhase === 'ended' ? (
                    <>
                      <span className="text-base font-bold text-neutral-300">경매가 종료되었습니다</span>
                      <span className="text-sm text-neutral-500">잠시만 기다려주세요</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
                        <span className="text-base font-bold text-neutral-200">다음 경매 준비 중...</span>
                      </div>
                      <span className="text-sm text-neutral-500">판매자가 다음 상품을 준비하고 있습니다</span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex gap-1 rounded-lg bg-neutral-900 p-0.5">
                    {bid.isUniqueAuction ? (
                      <div className="flex-1 rounded-md bg-neutral-800 py-1.5 text-center text-sm font-bold text-neutral-100">
                        유일 최고가 경매
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`flex-1 rounded-md py-1.5 text-sm font-bold transition ${
                            bid.activeTab === 'quick' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'
                          }`}
                          onClick={() => bid.setTab('quick')}
                        >
                          빠른 입찰
                        </button>
                        <button
                          type="button"
                          className={`flex-1 rounded-md py-1.5 text-sm font-bold transition ${
                            bid.activeTab === 'custom' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'
                          }`}
                          onClick={() => bid.setTab('custom')}
                        >
                          직접 입찰
                        </button>
                      </>
                    )}
                  </div>

                  {bid.isUniqueAuction ? (
                    <UniqueBidPanel bid={bid} />
                  ) : bid.activeTab === 'quick' ? (
                    <QuickBidPanel bid={bid} />
                  ) : (
                    <CustomBidPanel bid={bid} />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex min-h-32.5 flex-col justify-center gap-3 rounded-2xl bg-surface/80 px-2.5">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
              onClick={onToggleMute}
            >
              {isRemoteAudioMuted ? <LuVolumeOff size={18} /> : <LuVolume2 size={18} />}
            </button>
            {showChatToggle && (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
                onClick={onToggleChat}
              >
                <IoChatbubbleOutline size={18} />
              </button>
            )}
          </div>
        </div>

        {variant === 'overlay' && (
        <div className="flex items-center gap-2 px-4">
          <span className="shrink-0 text-warm/50 text-body-sm">투명도</span>
          <div className="relative h-[4px] flex-1">
            <div className="absolute inset-0 rounded-full bg-warm/20" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-warm/30"
              style={{ width: `${panelOpacityProgress}%` }}
            />
            <div
              className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-warm/50 bg-warm/60 shadow-[0_0_10px_rgba(212,174,107,0.35)]"
              style={{ left: `${panelOpacityProgress}%` }}
            />
            <input
              type="range"
              min={10}
              max={90}
              value={panelOpacity}
              onChange={(event) => setPanelOpacity(Number(event.target.value))}
              className="absolute left-0 right-0 -top-2 h-3 w-full cursor-pointer opacity-0"
            />
          </div>
        </div>
        )}
      </div>

      <BidAccessModal
        isOpen={bid.isBidAccessModalOpen}
        onClose={() => bid.setIsBidAccessModalOpen(false)}
        onAction={bid.handleBidAccessAction}
      />
      <AddressFormModal
        isOpen={bid.isAddressModalOpen}
        mode="add"
        defaultOnCreate
        description="배송지가 등록되어 있어야 경매에 참여할 수 있습니다."
        onClose={() => bid.setIsAddressModalOpen(false)}
      />
    </>
  );
}
