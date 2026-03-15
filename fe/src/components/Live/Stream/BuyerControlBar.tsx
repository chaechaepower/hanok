import { useCallback, useEffect, useState } from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { IoChatbubbleOutline, IoCheckmark } from 'react-icons/io5';
import { LuEye, LuVolume2, LuVolumeOff } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';

import { useGetWallet } from '@/api/hooks/useGetWallet';
import BidAccessModal from '@/components/Live/Auction/Buyer/BidAccessModal';
import KeyboardGuide from '@/components/Live/Auction/Buyer/KeyboardGuide';
import type { BidSyncPayload } from '@/types';
import { sendStreamMessage } from '@/websocket/stompClient';

const CUSTOM_UNIT_OPTIONS = [
  { label: '1천원', value: 1000 },
  { label: '5천원', value: 5000 },
  { label: '5만원', value: 50000 },
  { label: '자유', value: 0 },
];

type BidTab = 'quick' | 'custom';
type BidAccessModalType = 'login' | 'shipping' | null;

interface Props {
  bidSync: BidSyncPayload | null;
  activeAuctionId: number | null;
}

export default function BuyerControlBar({ bidSync, activeAuctionId }: Props) {
  const navigate = useNavigate();
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
  const [panelOpacity, setPanelOpacity] = useState(60);
  const [bidAccessModal, setBidAccessModal] = useState<BidAccessModalType>(null);

  const balance = wallet?.balance ?? 0;
  const currentBid = bidSync?.item.currentPrice ?? 0;
  const sellerUnit = bidSync?.item.bidUnit ?? 1000;
  const hasActiveAuction = Boolean(bidSync);
  const isFreeMode = tab === 'custom' && customUnit === 0;
  const quickUnit = tab === 'quick' ? sellerUnit : customUnit;
  const minimumBidAmount = currentBid + quickUnit;
  const displayedBidAmount = isFreeMode ? bidAmount : Math.max(bidAmount, minimumBidAmount);
  const effectiveBidAmount = hasActiveAuction ? Math.max(displayedBidAmount, minimumBidAmount) : displayedBidAmount;
  const increment = hasActiveAuction ? effectiveBidAmount - currentBid : 0;
  const isInsufficientBalance = isLoggedIn && hasActiveAuction && effectiveBidAmount > balance;
  const hasRegisteredShippingAddress = true;
  // TODO: replace hasRegisteredShippingAddress with the shipping address lookup API result.

  useEffect(() => {
    if (!streamId) {
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: 'BID_SYNC',
      payload: null,
    }).catch((error) => {
      console.error('[stream] failed to send BID_SYNC', error);
    });
  }, [streamId]);

  const handleBidPlace = useCallback(() => {
    if (!hasActiveAuction) {
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
      console.error('[stream] missing streamId for BID_PLACED');
      return;
    }

    if (activeAuctionId === null) {
      console.error('[stream] missing active auctionId for BID_PLACED');
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: 'BID_PLACED',
      payload: {
        auctionId: activeAuctionId,
        amount: effectiveBidAmount,
      },
    }).catch((error) => {
      console.error('[stream] failed to send BID_PLACED', error);
    });
  }, [hasActiveAuction, isLoggedIn, hasRegisteredShippingAddress, isInsufficientBalance, streamId, activeAuctionId, effectiveBidAmount]);

  const handleBidAccessAction = () => {
    if (bidAccessModal === 'login') {
      navigate('/login');
    } else if (bidAccessModal === 'shipping') {
      navigate('/settings');
    }

    setBidAccessModal(null);
  };

  const handleDecrease = useCallback(() => {
    if (isFreeMode) {
      return;
    }

    setBidAmount((prev) => Math.max(minimumBidAmount, Math.max(prev, minimumBidAmount) - quickUnit));
  }, [isFreeMode, minimumBidAmount, quickUnit]);

  const handleIncrease = useCallback(() => {
    if (isFreeMode) {
      return;
    }

    setBidAmount((prev) => Math.min(balance, Math.max(prev, minimumBidAmount) + quickUnit));
  }, [isFreeMode, balance, minimumBidAmount, quickUnit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      setActiveKeys((prev) => new Set(prev).add(event.key));

      switch (event.key) {
        case 'Tab':
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
          event.preventDefault();
          const currentIndex = CUSTOM_UNIT_OPTIONS.findIndex((o) => o.value === customUnit);
          const prevIndex = (currentIndex - 1 + CUSTOM_UNIT_OPTIONS.length) % CUSTOM_UNIT_OPTIONS.length;
          setCustomUnit(CUSTOM_UNIT_OPTIONS[prevIndex].value);
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          const currentIndex = CUSTOM_UNIT_OPTIONS.findIndex((o) => o.value === customUnit);
          const nextIndex = (currentIndex + 1) % CUSTOM_UNIT_OPTIONS.length;
          setCustomUnit(CUSTOM_UNIT_OPTIONS[nextIndex].value);
          break;
        }
      }
    },
    [customUnit, handleBidPlace, handleIncrease, handleDecrease],
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
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${tab === 'quick' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'}`}
                  onClick={() => setTab('quick')}
                >
                  입찰하기
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${tab === 'custom' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'}`}
                  onClick={() => setTab('custom')}
                >
                  자율입찰
                </button>
              </div>

              {tab === 'quick' ? (
                <div className="flex flex-1 gap-2">
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-neutral-900 px-3 py-1">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-neutral-500">잔고</span>
                      <span className="text-xs font-bold tabular-nums text-neutral-100">{balance.toLocaleString()}원</span>
                    </div>
                    {isInsufficientBalance && <span className="mt-1 text-[10px] font-bold text-accent-light">잔고 부족</span>}
                  </div>
                  <button
                    type="button"
                    className="flex flex-3 items-center rounded-xl bg-gold px-3 text-neutral-100 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={handleBidPlace}
                    disabled={isInsufficientBalance}
                  >
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <IoCheckmark size={16} strokeWidth={4} />
                        {hasActiveAuction ? `${effectiveBidAmount.toLocaleString()}원으로 입찰` : '입찰'}
                      </div>
                      {hasActiveAuction && <span className="text-xs font-bold text-gold-light">(+{increment.toLocaleString()})</span>}
                    </div>
                    <span className="rounded bg-warm/15 px-1.5 py-3 text-[10px] font-bold text-gold-light">
                      ENTER
                    </span>
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
                            customUnit === option.value ? 'bg-gold text-neutral-100' : 'text-neutral-500'
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
                          <span className="text-xs font-bold tabular-nums text-neutral-100">{balance.toLocaleString()}원</span>
                        </div>
                        {isInsufficientBalance && <span className="mt-1 text-[10px] font-bold text-accent-light">잔고 부족</span>}
                      </div>
                      <div className="h-5 w-px bg-neutral-700" />
                      <button
                        type="button"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${isFreeMode ? 'bg-neutral-900 text-neutral-600' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'}`}
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
                          placeholder="금액 입력"
                          className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-neutral-100 outline-none placeholder:text-neutral-600"
                        />
                      ) : (
                        <div className="min-w-0 flex-1 text-center text-sm font-black tabular-nums text-neutral-100">
                          {hasActiveAuction ? (
                            <>
                              {effectiveBidAmount.toLocaleString()} <span className="text-xs font-normal text-neutral-400">원</span>
                            </>
                          ) : null}
                        </div>
                      )}
                      <button
                        type="button"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${isFreeMode ? 'bg-neutral-900 text-neutral-600' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'}`}
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
                    disabled={isInsufficientBalance}
                  >
                    <div className="flex flex-1 flex-col items-center gap-0.5">
                      <span className="text-lg font-black">입찰</span>
                      {hasActiveAuction && (
                        <>
                          <span className="text-[10px] font-bold tabular-nums text-gold-light">{effectiveBidAmount.toLocaleString()}원</span>
                          <span className="text-[10px] font-bold text-gold">+{increment.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    <span className="rounded bg-warm/15 px-1.5 py-3 text-[10px] font-bold text-gold-light">
                      ENTER
                    </span>
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
          <LuEye size={10} className="shrink-0 text-warm/30" />
          <div className="relative h-px flex-1">
            <div className="absolute inset-0 rounded-full bg-warm/20" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-warm/40"
              style={{ width: `${((panelOpacity - 10) / 80) * 100}%` }}
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
