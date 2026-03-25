import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePostFollow } from '@/api/hooks/usePostFollow';
import { useStompChat } from '@/hooks/useStompChat';
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chat' | 'auction'>('chat');
  const { messages, sendMessage, sendMacro, connectionState } = useStompChat(streamEnter?.category ?? '');
  const [followStateOverride, setFollowStateOverride] = useState<{ sellerId: number; value: boolean } | null>(null);
  const { mutate: postFollow, isPending: isFollowPending } = usePostFollow();
  const currentUserId = useMemo(() => {
    const stored = localStorage.getItem('userId');
    const parsed = stored ? Number(stored) : NaN;
    return Number.isNaN(parsed) ? null : parsed;
  }, []);
  const sellerId = streamEnter?.seller.sellerId ?? 0;
  const sellerNickname = streamEnter?.seller.nickname ?? 'seller';
  const sellerProfileImage = streamEnter?.seller.profileImage ?? null;
  const isFollowing =
    followStateOverride?.sellerId === sellerId ? followStateOverride.value : (streamEnter?.isFollowing ?? false);

  const handleFollowToggle = () => {
    if (sellerId <= 0 || isFollowPending) {
      return;
    }

    postFollow(
      { targetSellerId: sellerId },
      {
        onSuccess: (response) => setFollowStateOverride({ sellerId, value: response.following }),
      },
    );
  };

  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-background text-point">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(205,145,80,0.06)_0%,transparent_50%)]" />
        <div className="relative flex items-center gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => sellerId > 0 && !isSeller && navigate(`/profile/${sellerId}`)}
            disabled={sellerId <= 0 || isSeller}
            className="group relative shrink-0"
          >
            <div className="relative">
              {sellerProfileImage ? (
                <img
                  src={sellerProfileImage}
                  alt={sellerNickname}
                  className="h-13 w-13 rounded-full object-cover shadow-[0_0_0_2px_rgba(205,145,80,0.15)] transition group-hover:shadow-[0_0_0_2px_rgba(205,145,80,0.4)]"
                />
              ) : (
                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 text-sm font-bold text-gold shadow-[0_0_0_2px_rgba(205,145,80,0.15)] transition group-hover:shadow-[0_0_0_2px_rgba(205,145,80,0.4)]">
                  {getSellerInitial(sellerNickname)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-background bg-ember shadow-[0_0_6px_rgba(94,205,172,0.4)]" />
            </div>
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => sellerId > 0 && !isSeller && navigate(`/profile/${sellerId}`)}
              disabled={sellerId <= 0 || isSeller}
              className="min-w-0 text-left disabled:cursor-default"
            >
              <span className="block truncate text-base font-bold text-neutral-100 transition hover:text-gold-light">{sellerNickname}</span>
            </button>
            {sellerId > 0 && !isSeller && (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={isFollowPending}
                className={`shrink-0 rounded-full px-3 py-1 text-label font-bold transition ${
                  isFollowing
                    ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                    : 'bg-gold/15 text-gold hover:bg-gold/25'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isFollowing ? '✓ 팔로잉' : '+ 팔로우'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-neutral-800" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'chat'}
          className={`flex-1 py-3 text-sm font-bold transition ${
            activeTab === 'chat' ? 'border-b-2 border-gold text-neutral-100' : 'text-neutral-500'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          채팅
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'auction'}
          className={`flex-1 py-3 text-sm font-bold transition ${
            activeTab === 'auction' ? 'border-b-2 border-gold text-neutral-100' : 'text-neutral-500'
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
            currentUserId={currentUserId}
          />
        ) : (
          <ChatPanel
            streamId={streamEnter?.streamId ?? 0}
            category={streamEnter?.category ?? ''}
            notice={streamEnter?.notice ?? null}
            messages={messages}
            connectionState={connectionState}
            onSendMessage={sendMessage}
            onSendMacro={sendMacro}
          />
        )}
      </div>
    </div>
  );
}
