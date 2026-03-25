import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import type { BidSyncPayload, LiveAuctionType, UniqueBidSyncPayload } from '@/types';
import { sendStreamMessage } from '@/websocket/stompClient';
import { useToast } from '@/hooks/useToast';
import bidEffectSound from '@/assets/bid_effect_sound.mp3';

const preloadedBidAudio = new Audio(bidEffectSound);
preloadedBidAudio.load();

export type BidTab = 'quick' | 'custom';
export type AuctionEndPhase = 'ended' | 'waiting' | null;

export const CUSTOM_UNIT_OPTIONS = [
  { label: '1천원', value: 1000 },
  { label: '5천원', value: 5000 },
  { label: '5만원', value: 50000 },
  { label: '직접입력', value: 0 },
];

interface UseBidStateParams {
  auctionType: LiveAuctionType | null;
  bidSync: BidSyncPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  activeAuctionId: number | null;
}

export type BidState = ReturnType<typeof useBidState>;

export function useBidState({ auctionType, bidSync, uniqueBidSync, activeAuctionId }: UseBidStateParams) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { id: streamId } = useParams<{ id: string }>();
  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem('accessToken')), []);
  const { data: wallet } = useGetWallet(isLoggedIn);
  const { data: addresses, isLoading: isAddressesLoading } = useGetAddresses(isLoggedIn);

  const [tab, setTab] = useState<BidTab>('quick');
  const [customUnit, setCustomUnit] = useState(1000);
  const [bidAmount, setBidAmount] = useState(1000);
  const [freeInput, setFreeInput] = useState('');
  const [isBidAccessModalOpen, setIsBidAccessModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [auctionEndPhase, setAuctionEndPhase] = useState<AuctionEndPhase>(null);
  const hadActiveAuctionRef = useRef(false);
  const suppressNextUniqueBidAttemptRef = useRef<number | null>(null);

  const balance = wallet?.balance ?? 0;
  const isUniqueAuction = auctionType === 'UNIQUE_TOP';
  const activeTab: BidTab = isUniqueAuction ? 'custom' : tab;
  const activeCustomUnit = isUniqueAuction ? 0 : customUnit;
  const currentPrice = isUniqueAuction ? (uniqueBidSync?.bidRange.minPrice ?? 0) : (bidSync?.item.currentPrice ?? 0);
  const baseBidUnit = bidSync?.item.bidUnit ?? 1000;
  const uniqueMinPrice = uniqueBidSync?.bidRange.minPrice ?? 0;
  const uniqueMaxPrice = uniqueBidSync?.bidRange.maxPrice ?? 0;
  const hasPlacedUniqueBid = uniqueBidSync?.hasBid ?? false;
  const hasActiveAuction = isUniqueAuction ? Boolean(uniqueBidSync) : Boolean(bidSync);
  const visibleAuctionEndPhase = hasActiveAuction ? null : auctionEndPhase;
  const uniqueInputAmount = freeInput ? Number(freeInput) : 0;

  const normalizeUniqueBidAmount = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) return 0;
      return Math.min(Math.max(Math.round(amount), uniqueMinPrice), uniqueMaxPrice);
    },
    [uniqueMaxPrice, uniqueMinPrice],
  );

  const isFreeMode = activeTab === 'custom' && activeCustomUnit === 0;
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
  const hasRegisteredShippingAddress = Boolean(addresses?.length) && addresses?.some((address) => address.isDefault);

  const applyUniqueBidCorrection = useCallback(
    (amount: number, options?: { suppressNextBidAttempt?: boolean }) => {
      const correctedUniqueBidAmount = normalizeUniqueBidAmount(amount);
      if (correctedUniqueBidAmount === amount) return true;
      if (options?.suppressNextBidAttempt) {
        suppressNextUniqueBidAttemptRef.current = activeAuctionId;
      }
      setFreeInput(String(correctedUniqueBidAmount));
      setBidAmount(correctedUniqueBidAmount);
      showToast({ message: '입찰가를 허용 범위로 보정했습니다. 다시 입찰해주세요.' });
      return false;
    },
    [activeAuctionId, normalizeUniqueBidAmount, showToast],
  );

  const handleBidPlace = useCallback(() => {
    if (!hasActiveAuction) {
      showToast({ message: '진행 중인 경매 정보를 불러오는 중입니다.' });
      return;
    }
    if (!isLoggedIn) { setIsBidAccessModalOpen(true); return; }
    if (isAddressesLoading) { showToast({ message: '배송지 정보를 확인하는 중입니다.' }); return; }
    if (!hasRegisteredShippingAddress) { setIsAddressModalOpen(true); return; }
    if (isInsufficientBalance) return;
    if (!streamId) { console.error('[stream] missing streamId for bid'); return; }
    if (activeAuctionId === null) { console.error('[stream] missing active auctionId for bid'); return; }

    if (isUniqueAuction) {
      if (hasPlacedUniqueBid) return;
      if (freeInput.trim().length === 0) { showToast({ message: '입찰 금액을 직접 입력해주세요.' }); return; }
      if (suppressNextUniqueBidAttemptRef.current === activeAuctionId) {
        suppressNextUniqueBidAttemptRef.current = null;
        return;
      }
      if (!applyUniqueBidCorrection(uniqueInputAmount)) return;
    }

    (preloadedBidAudio.cloneNode(true) as HTMLAudioElement).play().catch(() => {});

    void sendStreamMessage(streamId, {
      eventType: isUniqueAuction ? 'UNIQUE_BID_PLACE' : 'BID_PLACED',
      payload: { auctionId: activeAuctionId, amount: effectiveBidAmount },
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      })
      .catch((error) => { console.error('[stream] failed to send bid', error); });
  }, [
    activeAuctionId, effectiveBidAmount, freeInput, hasActiveAuction, queryClient,
    hasPlacedUniqueBid, hasRegisteredShippingAddress, isAddressesLoading,
    isInsufficientBalance, isLoggedIn, isUniqueAuction,
    applyUniqueBidCorrection, showToast, streamId, uniqueInputAmount,
  ]);

  const handleBidAccessAction = useCallback(() => {
    navigate('/login');
    setIsBidAccessModalOpen(false);
  }, [navigate]);

  const handleDecrease = useCallback(() => {
    if (isFreeMode || isUniqueAuction) return;
    setBidAmount((prev) => Math.max(minimumBidAmount, Math.max(prev, minimumBidAmount) - quickUnit));
  }, [isFreeMode, isUniqueAuction, minimumBidAmount, quickUnit]);

  const handleIncrease = useCallback(() => {
    if (isFreeMode || isUniqueAuction) return;
    setBidAmount((prev) => Math.min(balance, Math.max(prev, minimumBidAmount) + quickUnit));
  }, [balance, isFreeMode, isUniqueAuction, minimumBidAmount, quickUnit]);

  const handleFreeInput = useCallback((value: string) => {
    if (hasPlacedUniqueBid) return;
    const nextValue = value.replace(/[^0-9]/g, '');
    setFreeInput(nextValue);
    suppressNextUniqueBidAttemptRef.current = null;
    setBidAmount(nextValue ? Number(nextValue) : 0);
  }, [hasPlacedUniqueBid]);

  const handleUniqueInputBlur = useCallback(() => {
    if (hasPlacedUniqueBid || !freeInput.trim()) return;
    applyUniqueBidCorrection(Number(freeInput), { suppressNextBidAttempt: true });
  }, [applyUniqueBidCorrection, freeInput, hasPlacedUniqueBid]);

  // auction end phase transition
  useEffect(() => {
    if (hasActiveAuction) {
      hadActiveAuctionRef.current = true;
      const resetTimer = window.setTimeout(() => setAuctionEndPhase(null), 0);
      return () => window.clearTimeout(resetTimer);
    }
    if (hadActiveAuctionRef.current) {
      const endedTimer = window.setTimeout(() => setAuctionEndPhase('ended'), 0);
      const waitingTimer = window.setTimeout(() => setAuctionEndPhase('waiting'), 3000);
      return () => { window.clearTimeout(endedTimer); window.clearTimeout(waitingTimer); };
    }
  }, [hasActiveAuction]);

  return {
    tab, setTab,
    customUnit, setCustomUnit,
    freeInput,
    isBidAccessModalOpen, setIsBidAccessModalOpen,
    isAddressModalOpen, setIsAddressModalOpen,
    isLoggedIn, balance, isUniqueAuction,
    activeTab, activeCustomUnit, currentPrice, baseBidUnit,
    uniqueMinPrice, uniqueMaxPrice, hasPlacedUniqueBid,
    hasActiveAuction, visibleAuctionEndPhase, uniqueInputAmount,
    isFreeMode, quickUnit, minimumBidAmount,
    displayedBidAmount, effectiveBidAmount,
    increment, isInsufficientBalance, isHighestBidder,
    isBidDisabled, hasRegisteredShippingAddress,
    handleBidPlace, handleBidAccessAction,
    handleDecrease, handleIncrease,
    handleFreeInput, handleUniqueInputBlur,
  };
}
