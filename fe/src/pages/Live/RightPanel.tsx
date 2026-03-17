import { useState } from 'react';

import { usePostFollow } from '@/api/hooks/usePostFollow';
import AuctionPanel from '@/components/Live/Auction/shared/AuctionPanel';
import ChatPanel from '@/components/Live/Chat/ChatPanel';
import type { AuctionStatisticsPayload, LiveAuctionType, StreamEnterResponse, UniqueBidSyncPayload } from '@/types';

interface Props {
  isSeller: boolean;
  auctionType: LiveAuctionType | null;
  auctionStatistics: AuctionStatisticsPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  streamEnter: StreamEnterResponse | null;
}

const getSellerInitial = (nickname?: string) => nickname?.trim().charAt(0).toUpperCase() || 'Y';

export default function RightPanel({ isSeller, auctionType, auctionStatistics, uniqueBidSync, streamEnter }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'auction'>('chat');
  const [followStateOverride, setFollowStateOverride] = useState<{ sellerId: number; value: boolean } | null>(null);
  const { mutate: postFollow, isPending: isFollowPending } = usePostFollow();
  const storedUserId =
    typeof window === 'undefined' ? 0 : Number.parseInt(window.localStorage.getItem('userId') ?? '0', 10);

  const sellerId = streamEnter?.seller.sellerId ?? 0;
  const sellerNickname = streamEnter?.seller.nickname ?? 'seller';
  const sellerProfileImage = streamEnter?.seller.profileImage ?? null;
  const currentUserId = Number.isFinite(storedUserId) ? storedUserId : 0;
  const isOwnStore = sellerId > 0 && sellerId === currentUserId;
  const isFollowActionPending = isFollowPending;
  const isFollowing =
    followStateOverride?.sellerId === sellerId ? followStateOverride.value : (streamEnter?.isFollowing ?? false);

  const handleFollowToggle = () => {
    if (sellerId <= 0 || isFollowActionPending) {
      return;
    }

    postFollow(
      { userId: sellerId },
      {
        onSuccess: (response) => setFollowStateOverride({ sellerId, value: response.following }),
      },
    );
  };

  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-background text-point">
      <div className="flex items-center justify-between gap-2.5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {sellerProfileImage ? (
            <img src={sellerProfileImage} alt={sellerNickname} className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-gold">
              {getSellerInitial(sellerNickname)}
            </div>
          )}
          <div className="min-w-0 truncate text-xs font-bold text-neutral-100">{sellerNickname}</div>
        </div>

        {sellerId > 0 && !isSeller && !isOwnStore && (
          <button
            type="button"
            onClick={handleFollowToggle}
            disabled={isFollowActionPending}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
              isFollowing
                ? 'border border-neutral-600 bg-transparent text-neutral-300 hover:bg-warm/10'
                : 'bg-neutral-100 text-background hover:bg-neutral-200'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isFollowing ? '언팔로우' : '팔로우'}
          </button>
        )}
      </div>

      <div className="flex border-b border-neutral-800">
        <button
          className={`flex-1 py-3 text-[13px] font-bold transition ${
            activeTab === 'chat' ? 'border-b-2 border-gold text-neutral-100' : 'text-neutral-600'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          채팅
        </button>
        <button
          className={`flex-1 py-3 text-[13px] font-bold transition ${
            activeTab === 'auction' ? 'border-b-2 border-gold text-neutral-100' : 'text-neutral-600'
          }`}
          onClick={() => setActiveTab('auction')}
        >
          경매 현황
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'auction' ? (
          <AuctionPanel
            isSeller={isSeller}
            auctionType={auctionType}
            auctionStatistics={auctionStatistics}
            uniqueBidSync={uniqueBidSync}
          />
        ) : (
          <ChatPanel />
        )}
      </div>
    </div>
  );
}
