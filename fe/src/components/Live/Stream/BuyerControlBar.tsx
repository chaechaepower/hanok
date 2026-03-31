import { memo, useCallback, useState } from 'react';
import { IoChatbubbleOutline } from 'react-icons/io5';
import { LuVolume2, LuVolumeOff } from 'react-icons/lu';

import BidAccessModal from '@/components/Live/Auction/Buyer/BidAccessModal';
import CustomBidPanel from '@/components/Live/Auction/Buyer/CustomBidPanel';
import QuickBidPanel from '@/components/Live/Auction/Buyer/QuickBidPanel';
import UniqueBidPanel from '@/components/Live/Auction/Buyer/UniqueBidPanel';
import KeyboardGuide from '@/components/Live/Auction/shared/KeyboardGuide';
import InfoPanelTooltip from '@/components/common/InfoPanelTooltip';
import AddressFormModal from '@/components/common/modal/AddressFormModal';
import { AUCTION_TYPE_DESCRIPTIONS } from '@/constants/auction';
import type { BidSyncPayload, LiveAuctionType, UniqueBidSyncPayload } from '@/types';
import { useBidState, CUSTOM_UNIT_OPTIONS } from '@/hooks/useBidState';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRenderStats } from '@/hooks/useRenderStats';
import { isBidSyncEqual, isUniqueBidSyncEqual } from '@/utils/liveEquality';
import { isLiveStructureOptimizationEnabled } from '@/utils/liveOptimization';

export type ControlBarVariant = 'overlay' | 'inline';

const BUYER_AUCTION_TYPE_LABELS: Record<Exclude<LiveAuctionType, null>, string> = {
  BOTTOM_UP: '상향식 경매',
  UNIQUE_TOP: '유일최고가 경매',
};

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

function BuyerControlBar({
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
  useRenderStats('BuyerControlBar');

  const bid = useBidState({ auctionType, bidSync, uniqueBidSync, activeAuctionId });
  const auctionTypeDescription = auctionType ? AUCTION_TYPE_DESCRIPTIONS[auctionType] : null;

  const [guideOpen, setGuideOpen] = useState(false);

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
        {auctionType ? (
          <div className="flex items-center gap-2">
            <div className="group relative">
              <div
                tabIndex={0}
                className="rounded-full border border-gold/30 bg-surface/85 px-4 py-3 text-price-sm font-bold tracking-[0.12em] text-gold shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-md outline-none"
              >
                {BUYER_AUCTION_TYPE_LABELS[auctionType]}
              </div>
              {auctionTypeDescription ? (
                <InfoPanelTooltip placementClassName="bottom-full left-0 mb-2" widthClassName="w-72">
                  <p className="whitespace-pre-line leading-5 text-neutral-300">{auctionTypeDescription}</p>
                </InfoPanelTooltip>
              ) : null}
            </div>
            {auctionType === 'UNIQUE_TOP' && uniqueBidSync?.bidRange ? (
              <>
                <div className="rounded-full border border-white/8 bg-surface/75 px-4 py-3 text-price-sm font-bold tabular-nums text-neutral-300 backdrop-blur-md">
                  입찰 범위 {uniqueBidSync.bidRange.minPrice.toLocaleString()} ~{' '}
                  {uniqueBidSync.bidRange.maxPrice.toLocaleString()}원
                </div>
                <div className="rounded-full border border-white/8 bg-surface/75 px-4 py-3 text-price-sm font-bold text-neutral-300 backdrop-blur-md">
                  중복되지 않는 최고가를 제시하세요
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <KeyboardGuide
            variant="buyer"
            open={guideOpen}
            onToggle={setGuideOpen}
            activeKeys={activeKeys}
            placement={variant === 'inline' ? 'top' : 'left'}
          />

          <div className="mx-4 flex h-[120px] flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col gap-1.5 overflow-hidden rounded-2xl bg-surface/80 px-4 py-2">
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
                  {bid.isUniqueAuction ? null : (
                    <div className="flex gap-1 rounded-lg bg-neutral-900 p-0.5">
                      <button
                        type="button"
                        className={`flex-1 rounded-md py-1 text-sm font-bold transition ${
                          bid.activeTab === 'quick' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'
                        }`}
                        onClick={() => bid.setTab('quick')}
                      >
                        빠른 입찰
                      </button>
                      <button
                        type="button"
                        className={`flex-1 rounded-md py-1 text-sm font-bold transition ${
                          bid.activeTab === 'custom' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'
                        }`}
                        onClick={() => bid.setTab('custom')}
                      >
                        직접 입찰
                      </button>
                    </div>
                  )}

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

          <div className="flex h-[120px] flex-col justify-center gap-1.5 rounded-2xl bg-surface/80 px-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
              onClick={onToggleMute}
            >
              {isRemoteAudioMuted ? <LuVolumeOff size={18} /> : <LuVolume2 size={18} />}
            </button>
            {showChatToggle && (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
                onClick={onToggleChat}
              >
                <IoChatbubbleOutline size={18} />
              </button>
            )}
          </div>
        </div>
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

export default memo(BuyerControlBar, (prev, next) => {
  if (!isLiveStructureOptimizationEnabled()) {
    return false;
  }

  return (
    prev.auctionType === next.auctionType &&
    prev.activeAuctionId === next.activeAuctionId &&
    prev.isRemoteAudioMuted === next.isRemoteAudioMuted &&
    prev.onToggleMute === next.onToggleMute &&
    prev.onToggleChat === next.onToggleChat &&
    prev.variant === next.variant &&
    prev.showChatToggle === next.showChatToggle &&
    isBidSyncEqual(prev.bidSync, next.bidSync) &&
    isUniqueBidSyncEqual(prev.uniqueBidSync, next.uniqueBidSync)
  );
});
