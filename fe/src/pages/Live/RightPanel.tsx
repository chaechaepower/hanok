import { useState } from 'react';

import SellerAuctionPanel from '@/components/Live/Auction/Seller/SellerAuctionPanel';
import ChatPanel from '@/components/Live/Chat/ChatPanel';
import type { AuctionStatisticsPayload, StreamEnterResponse } from '@/types';

interface Props {
  isSeller: boolean;
  auctionStatistics: AuctionStatisticsPayload | null;
  streamEnter: StreamEnterResponse | null;
}

const getSellerInitial = (nickname?: string) => nickname?.trim().charAt(0).toUpperCase() || 'Y';

export default function RightPanel({ isSeller, auctionStatistics, streamEnter }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'auction'>('chat');
  const sellerNickname = streamEnter?.seller.nickname ?? '판매자명';
  const sellerProfileImage = streamEnter?.seller.profileImage ?? null;

  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-[#050505] text-point">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {sellerProfileImage ? (
            <img src={sellerProfileImage} alt={sellerNickname} className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#27272a] text-[10px] font-bold text-[#C5A059]">
              {getSellerInitial(sellerNickname)}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">{sellerNickname}</div>
          </div>
        </div>
      </div>

      {isSeller ? (
        <div className="flex border-b border-[rgba(255,255,255,.05)]">
          <button
            className={`flex-1 py-3 text-[13px] font-bold transition ${activeTab === 'chat' ? 'border-b-2 border-[#C5A059] text-white' : 'text-[#52525b]'}`}
            onClick={() => setActiveTab('chat')}
          >
            채팅
          </button>
          <button
            className={`flex-1 py-3 text-[13px] font-bold transition ${activeTab === 'auction' ? 'border-b-2 border-[#C5A059] text-white' : 'text-[#52525b]'}`}
            onClick={() => setActiveTab('auction')}
          >
            경매 현황
          </button>
        </div>
      ) : (
        <div className="flex border-b border-[rgba(255,255,255,.05)]">
          <div className="flex-1 border-b-2 border-[#C5A059] py-3 text-center text-[13px] font-bold text-white">
            채팅
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isSeller && activeTab === 'auction' ? (
          <SellerAuctionPanel auctionStatistics={auctionStatistics} />
        ) : (
          <ChatPanel topBidders={streamEnter?.topBidders} />
        )}
      </div>
    </div>
  );
}
