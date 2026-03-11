import { useEffect, useState } from 'react';
import { LuEye, LuVolume2, LuVolumeOff } from 'react-icons/lu';
import { IoChatbubbleOutline, IoCheckmark } from 'react-icons/io5';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { useGetWallet } from '@/api/hooks/useGetWallet';
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

interface Props {
  bidSync: BidSyncPayload | null;
}

// 구매자 전용 컨트롤바
// 좌: 키보드 가이드 | 중앙: 입찰 패널 | 우: 사운드 + 채팅 토글
export default function BuyerControlBar({ bidSync }: Props) {
  const { id: streamId } = useParams<{ id: string }>();
  const { data: wallet } = useGetWallet();
  const [guideOpen, setGuideOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [tab, setTab] = useState<BidTab>('quick');
  const [customUnit, setCustomUnit] = useState(1000);
  const [bidAmount, setBidAmount] = useState(1000);
  const [freeInput, setFreeInput] = useState('');
  const [panelOpacity, setPanelOpacity] = useState(60);

  const balance = wallet?.balance ?? 0;
  const currentBid = bidSync?.item.currentPrice ?? 0;
  const sellerUnit = bidSync?.item.bidUnit ?? 1000;
  const isFreeMode = tab === 'custom' && customUnit === 0;
  const quickUnit = tab === 'quick' ? sellerUnit : customUnit;
  const minimumBidAmount = currentBid + quickUnit;
  const displayedBidAmount = isFreeMode ? bidAmount : Math.max(bidAmount, minimumBidAmount);
  const increment = displayedBidAmount - currentBid;

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

  const handleBidPlace = () => {
    if (!streamId) {
      console.error('[stream] missing streamId for BID_PLACE');
      return;
    }

    void sendStreamMessage(streamId, {
      eventType: 'BID_PLACED',
      payload: {
        auctionId: 1,
        amount: displayedBidAmount,
      },
    }).catch((error) => {
      console.error('[stream] failed to send BID_PLACE', error);
    });
  };

  const handleDecrease = () => {
    if (isFreeMode) return;
    setBidAmount((prev) => Math.max(minimumBidAmount, Math.max(prev, minimumBidAmount) - quickUnit));
  };
  const handleIncrease = () => {
    if (isFreeMode) return;
    setBidAmount((prev) => Math.min(balance, Math.max(prev, minimumBidAmount) + quickUnit));
  };
  const handleFreeInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    setFreeInput(num);
    if (num) setBidAmount(Number(num));
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        {/* 좌하단: 키보드 가이드 */}
        <KeyboardGuide open={guideOpen} onToggle={setGuideOpen} />

        {/* 하단 중앙: 입찰 패널 */}
        <div className="flex flex-1 mx-4 h-32.5">
          <div
            className="flex flex-1 flex-col gap-2 rounded-2xl bg-[rgba(0,0,0,.6)] px-4 py-3"
            style={{ opacity: panelOpacity / 100 }}
          >
            {/* 탭 */}
            <div className="flex gap-1 rounded-lg bg-[#18181b] p-0.5">
              <button
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${tab === 'quick' ? 'bg-[#27272a] text-white' : 'text-[#71717a]'}`}
                onClick={() => setTab('quick')}
              >
                입찰하기
              </button>
              <button
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${tab === 'custom' ? 'bg-[#27272a] text-white' : 'text-[#71717a]'}`}
                onClick={() => setTab('custom')}
              >
                자율입찰
              </button>
            </div>

            {tab === 'quick' ? (
              <>
                {/* 잔고 + 현재 최고가 + 입찰 버튼 한 행 */}
                <div className="flex flex-1 gap-2">
                  <div className="flex flex-1 items-center justify-center gap-4 rounded-lg bg-[#18181b] px-3 py-1">
                    <span className="text-[10px] text-[#71717a]">잔고</span>
                    <span className="text-xs font-bold tabular-nums text-white">₩{balance.toLocaleString()}</span>
                  </div>
                  <button
                    className="flex flex-3 items-center rounded-xl bg-[#6366f1] px-3 text-white transition hover:bg-[#4f46e5]"
                    onClick={handleBidPlace}
                  >
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <IoCheckmark size={16} strokeWidth={4} />
                        {displayedBidAmount.toLocaleString()}원 으로 입찰
                      </div>
                      <span className="text-xs font-bold text-indigo-200">(+{increment.toLocaleString()})</span>
                    </div>
                    <span className="rounded bg-[rgba(255,255,255,.15)] px-1.5 py-3 text-[10px] font-bold text-indigo-200">
                      ENTER
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 gap-1">
                {/* 좌측: 단위칩 + 잔고·스테퍼 */}
                <div className="flex w-1/2 flex-col gap-2">
                  {/* 단위 선택 */}
                  <div className="flex rounded-lg bg-[#18181b] p-0.5">
                    {CUSTOM_UNIT_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition ${
                          customUnit === opt.value ? 'bg-[#3b82f6] text-white' : 'text-[#71717a]'
                        }`}
                        onClick={() => setCustomUnit(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* 잔고 | - 금액 + */}
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#18181b] px-2.5">
                      <span className="text-[10px] text-[#71717a]">잔고</span>
                      <span className="text-xs font-bold tabular-nums text-white">₩{balance.toLocaleString()}</span>
                    </div>
                    <div className="h-5 w-px bg-[#3f3f46]" />
                    <button
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${isFreeMode ? 'bg-[#18181b] text-[#52525b]' : 'bg-[#27272a] text-white hover:bg-[#3f3f46]'}`}
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
                        onChange={(e) => handleFreeInput(e.target.value)}
                        placeholder="금액 입력"
                        className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-white outline-none placeholder:text-[#52525b]"
                      />
                    ) : (
                      <div className="min-w-0 flex-1 text-center text-sm font-black tabular-nums text-white">
                        {displayedBidAmount.toLocaleString()} <span className="text-xs font-normal text-[#a1a1aa]">원</span>
                      </div>
                    )}
                    <button
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${isFreeMode ? 'bg-[#18181b] text-[#52525b]' : 'bg-[#27272a] text-white hover:bg-[#3f3f46]'}`}
                      onClick={handleIncrease}
                      disabled={isFreeMode}
                    >
                      <FiPlus size={12} />
                    </button>
                  </div>
                </div>

                {/* 우측: 큰 입찰 버튼 (1:1 비율) */}
                <button
                  className="flex flex-1 items-center rounded-xl bg-[#3b82f6] px-3 text-white transition hover:bg-[#2563eb]"
                  onClick={handleBidPlace}
                >
                  <div className="flex flex-1 flex-col items-center gap-0.5">
                    <span className="text-lg font-black">입찰</span>
                    <span className="text-[10px] font-bold tabular-nums text-blue-200">
                      {displayedBidAmount.toLocaleString()}원
                    </span>
                    <span className="text-[10px] font-bold text-blue-300">+{increment.toLocaleString()}</span>
                  </div>
                  <span className="rounded bg-[rgba(255,255,255,.15)] px-1.5 py-3 text-[10px] font-bold text-blue-200">
                    ENTER
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 우하단: 사운드 + 채팅 */}
        <div className="flex h-32.5 flex-col justify-center gap-3 rounded-2xl bg-[rgba(0,0,0,.6)] px-2.5">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-[rgba(255,255,255,.1)]"
            onClick={() => setMuted((prev) => !prev)}
          >
            {muted ? <LuVolumeOff size={18} /> : <LuVolume2 size={18} />}
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-[rgba(255,255,255,.1)]">
            <IoChatbubbleOutline size={18} />
          </button>
        </div>
      </div>

      {/* 투명도 슬라이더 — 화면 바닥 */}
      <div className="flex items-center gap-2 px-4">
        <LuEye size={10} className="shrink-0 text-white/30" />
        <div className="relative flex-1 h-px">
          <div className="absolute inset-0 rounded-full bg-white/20" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/40"
            style={{ width: `${((panelOpacity - 10) / 80) * 100}%` }}
          />
          <input
            type="range"
            min={10}
            max={90}
            value={panelOpacity}
            onChange={(e) => setPanelOpacity(Number(e.target.value))}
            className="absolute left-0 right-0 -top-2 h-3 w-full cursor-pointer opacity-0"
          />
        </div>
      </div>
    </div>
  );
}
