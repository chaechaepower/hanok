import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { IoChatbubbleOutline, IoCheckmark } from 'react-icons/io5';
import { LuVolume2, LuVolumeOff } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';

import { useGetWallet } from '@/api/hooks/useGetWallet';
import BidAccessModal from '@/components/Live/Auction/Buyer/BidAccessModal';
import KeyboardGuide from '@/components/Live/Auction/Buyer/KeyboardGuide';
import { useToast } from '@/components/common/Toast';
import type { BidSyncPayload, LiveAuctionType, UniqueBidSyncPayload } from '@/types';
import { sendStreamMessage } from '@/websocket/stompClient';

const CUSTOM_UNIT_OPTIONS = [
  { label: '1천원', value: 1000 },
  { label: '5천원', value: 5000 },
  { label: '5만원', value: 50000 },
  { label: '직접입력', value: 0 },
];

type BidTab = 'quick' | 'custom';
type BidAccessModalType = 'login' | 'shipping' | null;

interface Props {
  auctionType: LiveAuctionType | null;
  bidSync: BidSyncPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  activeAuctionId: number | null;
}

export default function BuyerControlBar({ auctionType, bidSync, uniqueBidSync, activeAuctionId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { id: streamId } = useParams<{ id: string }>();
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: wallet } = useGetWallet(isLoggedIn);
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);
  const [tab, setTab] = useState<BidTab>('quick');
  const [customUnit, setCustomUnit] = useState(1000);
  const [bidAmount, setBidAmount] = useState(1000);
  const [freeInput, setFreeInput] = useState('');
  const [panelOpacity, setPanelOpacity] = useState(90);
  const [bidAccessModal, setBidAccessModal] = useState<BidAccessModalType>(null);

  const balance = wallet?.balance ?? 0;
  const isUniqueAuction = auctionType === 'UNIQUE_TOP';
  const activeTab: BidTab = isUniqueAuction ? 'custom' : tab;
  const activeCustomUnit = isUniqueAuction ? 0 : customUnit;
  const currentPrice = isUniqueAuction ? (uniqueBidSync?.bidRange.minPrice ?? 0) : (bidSync?.item.currentPrice ?? 0);
  const baseBidUnit = isUniqueAuction ? (uniqueBidSync?.bidRange.bidUnit ?? 1000) : (bidSync?.item.bidUnit ?? 1000);
  const uniqueMinPrice = uniqueBidSync?.bidRange.minPrice ?? 0;
  const uniqueMaxPrice = uniqueBidSync?.bidRange.maxPrice ?? 0;
  const uniqueBidUnit = uniqueBidSync?.bidRange.bidUnit ?? 1000;
  const hasPlacedUniqueBid = uniqueBidSync?.hasBid ?? false;
  const hasActiveAuction = isUniqueAuction ? Boolean(uniqueBidSync) : Boolean(bidSync);
  const uniqueInputAmount = freeInput ? Number(freeInput) : 0;
  const isFreeMode = activeTab === 'custom' && activeCustomUnit === 0;
  const panelOpacityProgress = ((panelOpacity - 10) / 80) * 100;
  const quickUnit = activeTab === 'quick' ? baseBidUnit : activeCustomUnit;
  const minimumBidAmount = isUniqueAuction ? uniqueMinPrice : currentPrice + quickUnit;
  const displayedBidAmount = isFreeMode ? bidAmount : Math.max(bidAmount, minimumBidAmount);
  const effectiveBidAmount = isUniqueAuction
    ? uniqueInputAmount
    : hasActiveAuction
      ? Math.max(displayedBidAmount, minimumBidAmount)
      : displayedBidAmount;
  const increment = isUniqueAuction || !hasActiveAuction ? 0 : effectiveBidAmount - currentPrice;
  const isInsufficientBalance = isLoggedIn && hasActiveAuction && effectiveBidAmount > balance;
  const isHighestBidder = !isUniqueAuction && (bidSync?.isHighestBidder ?? false);
  const isBidDisabled =
    !hasActiveAuction ||
    isInsufficientBalance ||
    isHighestBidder ||
    (isUniqueAuction && (hasPlacedUniqueBid || freeInput.trim().length === 0));
  const hasRegisteredShippingAddress = true;
  // TODO: replace hasRegisteredShippingAddress with the shipping address lookup API result.

  const handleBidPlace = useCallback(() => {
    if (!hasActiveAuction) {
      showToast({ message: '진행 중인 경매 정보를 불러오는 중입니다.' });
      return;
    }

    if (!isLoggedIn) {
      setBidAccessModal('login');
      return;
    }

    if (!hasRegisteredShippingAddress) {
      setBidAccessModal('shipping');
      return;
    }

    if (isInsufficientBalance) {
      return;
    }

    if (!streamId) {
      console.error('[stream] missing streamId for bid');
      return;
    }

    if (activeAuctionId === null) {
      console.error('[stream] missing active auctionId for bid');
      return;
    }

    if (isUniqueAuction) {
      if (hasPlacedUniqueBid) {
        showToast({ message: '이미 입찰한 상품입니다.' });
        return;
      }

      if (freeInput.trim().length === 0) {
        showToast({ message: '입찰 금액을 직접 입력해주세요.' });
        return;
      }

      if (effectiveBidAmount < uniqueMinPrice || effectiveBidAmount > uniqueMaxPrice) {
        showToast({
          message: `입찰가는 ${uniqueMinPrice.toLocaleString()}원 ~ ${uniqueMaxPrice.toLocaleString()}원 범위여야 합니다.`,
        });
        return;
      }

      if ((effectiveBidAmount - uniqueMinPrice) % uniqueBidUnit !== 0) {
        showToast({ message: `${uniqueBidUnit.toLocaleString()}원 단위로 입찰해야 합니다.` });
        return;
      }
    }

    void sendStreamMessage(streamId, {
      eventType: isUniqueAuction ? 'UNIQUE_BID_PLACE' : 'BID_PLACED',
      payload: {
        auctionId: activeAuctionId,
        amount: effectiveBidAmount,
      },
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ['wallet'] }))
      .catch((error) => {
        console.error('[stream] failed to send bid', error);
      });
  }, [
    activeAuctionId,
    effectiveBidAmount,
    freeInput,
    hasActiveAuction,
    queryClient,
    hasPlacedUniqueBid,
    hasRegisteredShippingAddress,
    isInsufficientBalance,
    isLoggedIn,
    isUniqueAuction,
    showToast,
    streamId,
    uniqueBidUnit,
    uniqueMaxPrice,
    uniqueMinPrice,
  ]);

  const handleBidAccessAction = () => {
    if (bidAccessModal === 'login') {
      navigate('/login');
    } else if (bidAccessModal === 'shipping') {
      navigate('/settings');
    }

    setBidAccessModal(null);
  };

  const handleDecrease = useCallback(() => {
    if (isFreeMode || isUniqueAuction) {
      return;
    }

    setBidAmount((prev) => Math.max(minimumBidAmount, Math.max(prev, minimumBidAmount) - quickUnit));
  }, [isFreeMode, isUniqueAuction, minimumBidAmount, quickUnit]);

  const handleIncrease = useCallback(() => {
    if (isFreeMode || isUniqueAuction) {
      return;
    }

    setBidAmount((prev) => Math.min(balance, Math.max(prev, minimumBidAmount) + quickUnit));
  }, [balance, isFreeMode, isUniqueAuction, minimumBidAmount, quickUnit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) {
        return;
      }

      setActiveKeys((prev) => new Set(prev).add(event.key));

      switch (event.key) {
        case 'Tab':
          if (isUniqueAuction) {
            return;
          }
          event.preventDefault();
          setTab((prev) => (prev === 'quick' ? 'custom' : 'quick'));
          break;
        case 'Enter':
          event.preventDefault();
          handleBidPlace();
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleIncrease();
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleDecrease();
          break;
        case 'ArrowLeft': {
          if (isUniqueAuction) {
            return;
          }
          event.preventDefault();
          const currentIndex = CUSTOM_UNIT_OPTIONS.findIndex((option) => option.value === activeCustomUnit);
          const prevIndex = (currentIndex - 1 + CUSTOM_UNIT_OPTIONS.length) % CUSTOM_UNIT_OPTIONS.length;
          setCustomUnit(CUSTOM_UNIT_OPTIONS[prevIndex].value);
          break;
        }
        case 'ArrowRight': {
          if (isUniqueAuction) {
            return;
          }
          event.preventDefault();
          const currentIndex = CUSTOM_UNIT_OPTIONS.findIndex((option) => option.value === activeCustomUnit);
          const nextIndex = (currentIndex + 1) % CUSTOM_UNIT_OPTIONS.length;
          setCustomUnit(CUSTOM_UNIT_OPTIONS[nextIndex].value);
          break;
        }
      }
    },
    [activeCustomUnit, handleBidPlace, handleDecrease, handleIncrease, isUniqueAuction],
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(event.key);
      return next;
    });
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleFreeInput = (value: string) => {
    const nextValue = value.replace(/[^0-9]/g, '');
    setFreeInput(nextValue);

    if (!nextValue) {
      setBidAmount(0);
      return;
    }

    setBidAmount(Number(nextValue));
  };

  return (
    <>
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <KeyboardGuide open={guideOpen} onToggle={setGuideOpen} activeKeys={activeKeys} />

          <div className="mx-4 flex h-32.5 flex-1">
            <div
              className="flex flex-1 flex-col gap-2 rounded-2xl bg-surface/80 px-4 py-3"
              style={{ opacity: panelOpacity / 100 }}
            >
              <div className="flex gap-1 rounded-lg bg-neutral-900 p-0.5">
                {isUniqueAuction ? (
                  <div className="flex-1 rounded-md bg-neutral-800 py-1.5 text-center text-xs font-bold text-neutral-100">
                    유일 최고가 경매
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${
                        activeTab === 'quick' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'
                      }`}
                      onClick={() => setTab('quick')}
                    >
                      빠른 입찰
                    </button>
                    <button
                      type="button"
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${
                        activeTab === 'custom' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'
                      }`}
                      onClick={() => setTab('custom')}
                    >
                      직접 입찰
                    </button>
                  </>
                )}
              </div>

              {isUniqueAuction ? (
                <div className="flex flex-1 gap-1">
                  <div className="flex w-1/2 flex-col gap-2">
                    <div className="flex-1 rounded-md bg-neutral-800 px-3 py-1.5 text-center text-[10px] font-bold text-neutral-100">
                      {uniqueMinPrice.toLocaleString()} ~ {uniqueMaxPrice.toLocaleString()}원 /{' '}
                      {uniqueBidUnit.toLocaleString()}원 단위
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-lg bg-neutral-900 px-2.5 py-1">
                      <div className="flex min-h-8 shrink-0 flex-col justify-center rounded-lg bg-neutral-900 px-2.5 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-500">잔고</span>
                          <span className="text-xs font-bold tabular-nums text-neutral-100">
                            {balance.toLocaleString()}원
                          </span>
                        </div>
                        {isInsufficientBalance && (
                          <span className="mt-1 text-[10px] font-bold text-accent-light">잔고 부족</span>
                        )}
                      </div>
                      <div className="h-5 w-px bg-neutral-700" />

                      <input
                        type="text"
                        inputMode="numeric"
                        value={freeInput}
                        onChange={(event) => handleFreeInput(event.target.value)}
                        placeholder="입찰가 입력"
                        className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-neutral-100 outline-none placeholder:text-neutral-600"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex flex-1 items-center rounded-xl bg-gold px-3 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={handleBidPlace}
                    disabled={isBidDisabled}
                  >
                    <div className="flex flex-1 flex-col items-center gap-0.5">
                      <span className="text-lg font-black">{hasPlacedUniqueBid ? '완료' : '입찰'}</span>
                      {freeInput ? (
                        <span className="text-[10px] font-bold tabular-nums text-gold-light">
                          {effectiveBidAmount.toLocaleString()}원
                        </span>
                      ) : null}
                      <span className="text-[10px] font-bold text-gold">
                        {hasPlacedUniqueBid ? '1회 입찰 완료' : `${uniqueBidUnit.toLocaleString()}원 단위`}
                      </span>
                    </div>
                    <span className="rounded bg-warm/15 px-1.5 py-3 text-[10px] font-bold text-gold-light">ENTER</span>
                  </button>
                </div>
              ) : activeTab === 'quick' ? (
                <div className="flex flex-1 gap-2">
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-neutral-900 px-3 py-1">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-neutral-500">잔고</span>
                      <span className="text-xs font-bold tabular-nums text-neutral-100">
                        {balance.toLocaleString()}원
                      </span>
                    </div>
                    {isInsufficientBalance && (
                      <span className="mt-1 text-[10px] font-bold text-accent-light">잔고 부족</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="flex flex-3 items-center rounded-xl bg-gold px-3 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={handleBidPlace}
                    disabled={isBidDisabled}
                  >
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <IoCheckmark size={16} strokeWidth={4} />
                        {hasActiveAuction ? `${effectiveBidAmount.toLocaleString()}원으로 입찰` : '입찰'}
                      </div>
                      {hasActiveAuction && (
                        <span className="text-xs font-bold text-gold-light">(+{increment.toLocaleString()})</span>
                      )}
                    </div>
                    <span className="rounded bg-warm/15 px-1.5 py-3 text-[10px] font-bold text-gold-light">ENTER</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-1 gap-1">
                  <div className="flex w-1/2 flex-col gap-2">
                    <div className="flex rounded-lg bg-neutral-900 p-0.5">
                      {CUSTOM_UNIT_OPTIONS.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition ${
                            activeCustomUnit === option.value ? 'bg-gold text-neutral-100' : 'text-neutral-500'
                          }`}
                          onClick={() => setCustomUnit(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-1 items-center gap-2">
                      <div className="flex min-h-8 shrink-0 flex-col justify-center rounded-lg bg-neutral-900 px-2.5 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-500">잔고</span>
                          <span className="text-xs font-bold tabular-nums text-neutral-100">
                            {balance.toLocaleString()}원
                          </span>
                        </div>
                        {isInsufficientBalance && (
                          <span className="mt-1 text-[10px] font-bold text-accent-light">잔고 부족</span>
                        )}
                      </div>
                      <div className="h-5 w-px bg-neutral-700" />
                      <button
                        type="button"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                          isFreeMode
                            ? 'bg-neutral-900 text-neutral-600'
                            : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
                        }`}
                        onClick={handleDecrease}
                        disabled={isFreeMode}
                      >
                        <FiMinus size={12} />
                      </button>
                      {isFreeMode ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={freeInput}
                          onChange={(event) => handleFreeInput(event.target.value)}
                          placeholder="입찰가 입력"
                          className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-neutral-100 outline-none placeholder:text-neutral-600"
                        />
                      ) : (
                        <div className="min-w-0 flex-1 text-center text-sm font-black tabular-nums text-neutral-100">
                          {hasActiveAuction ? (
                            <>
                              {effectiveBidAmount.toLocaleString()}{' '}
                              <span className="text-xs font-normal text-neutral-400">원</span>
                            </>
                          ) : null}
                        </div>
                      )}
                      <button
                        type="button"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                          isFreeMode
                            ? 'bg-neutral-900 text-neutral-600'
                            : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
                        }`}
                        onClick={handleIncrease}
                        disabled={isFreeMode}
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex flex-1 items-center rounded-xl bg-gold px-3 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={handleBidPlace}
                    disabled={isBidDisabled}
                  >
                    <div className="flex flex-1 flex-col items-center gap-0.5">
                      <span className="text-lg font-black">입찰</span>
                      <span className="text-[10px] font-bold tabular-nums text-gold-light">
                        {effectiveBidAmount.toLocaleString()}원
                      </span>
                      <span className="text-[10px] font-bold text-gold">+{increment.toLocaleString()}</span>
                    </div>
                    <span className="rounded bg-warm/15 px-1.5 py-3 text-[10px] font-bold text-gold-light">ENTER</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex h-32.5 flex-col justify-center gap-3 rounded-2xl bg-surface/80 px-2.5">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
              onClick={() => setMuted((prev) => !prev)}
            >
              {muted ? <LuVolumeOff size={18} /> : <LuVolume2 size={18} />}
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
            >
              <IoChatbubbleOutline size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4">
          <span className="shrink-0 text-warm/50 text-[12px]">투명도</span>
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
      </div>

      <BidAccessModal
        isOpen={bidAccessModal !== null}
        variant={bidAccessModal}
        onClose={() => setBidAccessModal(null)}
        onAction={handleBidAccessAction}
      />
    </>
  );
}
