import { useState } from "react";
import { LuMic, LuRadio, LuKeyboard } from "react-icons/lu";
import { IoChevronUp, IoChevronDown, IoChevronBack, IoChevronForward } from "react-icons/io5";
import KeyboardGuide from "@/components/Live/Auction/Seller/KeyboardGuide";

// 판매자 전용 컨트롤바
// 좌: 키보드 가이드 | 중앙: 액션 버튼 (설명/경매 시작) | 우: 미디어
export default function SellerControlBar() {
    const [guideOpen, setGuideOpen] = useState(false);

    return (
        <div className="absolute bottom-4 left-4 right-4 flex items-stretch justify-between">
            {/* 좌하단: 키보드 가이드 */}
            <KeyboardGuide open={guideOpen} onToggle={setGuideOpen} />

            {/* 하단 중앙: 액션 버튼 */}
            <div className="flex flex-1 items-center flex-col gap-2 px-4">
                <button className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] text-sm font-bold text-[#a1a1aa] transition hover:bg-[rgba(255,255,255,.1)]">
                    <GoClock size={15} />
                    설명 시작
                    <span className="rounded bg-[#27272a] px-1.5 py-0.5 text-[10px] text-[#71717a]">SPACE</span>
                </button>
                <button className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-[#C5A059] text-sm font-black text-black transition hover:bg-[#d4b068]">
                    <PlayIcon />
                    경매 시작
                    <span className="rounded bg-[rgba(0,0,0,.15)] px-1.5 py-0.5 text-[10px] font-bold text-[rgba(0,0,0,.5)]">ENTER</span>
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
