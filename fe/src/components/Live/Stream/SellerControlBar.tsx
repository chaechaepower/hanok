import { useState } from 'react';
import { LuMic, LuRadio } from 'react-icons/lu';
import KeyboardGuide from '@/components/Live/Auction/Seller/KeyboardGuide';
import { useParams } from 'react-router-dom';
import { sendStreamMessage } from '@/websocket/stompClient';

// 판매자 전용 컨트롤바
// 좌: 키보드 가이드 | 중앙: 액션 버튼 (설명/경매 시작) | 우: 미디어
interface Props {
  introduceAuctionId: number | null;
  startAuctionId: number | null;
  canIntroduce: boolean;
  canStart: boolean;
}

export default function SellerControlBar({ introduceAuctionId, startAuctionId, canIntroduce, canStart }: Props) {
  const [guideOpen, setGuideOpen] = useState(false);
  const { id: streamId } = useParams<{ id: string }>();

  // 경매 시작 socket
  const handleAuctionStart = () => {
    if (!streamId) {
      console.error('[stream] missing streamId for AUCTION_START');
      return;
    }

    if (startAuctionId === null) {
      console.error('[stream] missing auctionId for AUCTION_START');
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: 'AUCTION_START',
      payload: {
        auctionId: startAuctionId,
      },
    }).catch((error) => {
      console.error('[stream] failed to send AUCTION_START', error);
    });
  };

  const handleAuctionItemIntroduce = () => {
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
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 flex items-stretch justify-between">
      {/* 좌하단: 키보드 가이드 */}
      <KeyboardGuide open={guideOpen} onToggle={setGuideOpen} />

      {/* 하단 중앙: 액션 버튼 */}
      <div className="flex flex-1 items-center flex-col gap-2 px-4">
        <button
          type="button"
          onClick={handleAuctionItemIntroduce}
          disabled={!canIntroduce}
          className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] text-sm font-bold text-[#a1a1aa] transition hover:bg-[rgba(255,255,255,.1)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[rgba(255,255,255,.05)]"
        >
          <GoClock size={15} />
          설명 시작
          <span className="rounded bg-[#27272a] px-1.5 py-0.5 text-[10px] text-[#71717a]">SPACE</span>
        </button>
        <button
          type="button"
          onClick={handleAuctionStart}
          disabled={!canStart}
          className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-[#C5A059] text-sm font-black text-black transition hover:bg-[#d4b068] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#C5A059]"
        >
          <PlayIcon />
          경매 시작
          <span className="rounded bg-[rgba(0,0,0,.15)] px-1.5 py-0.5 text-[10px] font-bold text-[rgba(0,0,0,.5)]">
            ENTER
          </span>
        </button>
      </div>

      {/* 우하단: 미디어 컨트롤 */}
      <div className="flex flex-col justify-center gap-3 rounded-2xl bg-[rgba(0,0,0,.6)] px-2.5">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-[rgba(255,255,255,.1)]">
          <LuMic size={18} />
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-[rgba(255,255,255,.1)]">
          <LuRadio size={18} />
        </button>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="black" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function GoClock({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
