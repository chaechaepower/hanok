import { LuMic, LuRadio } from "react-icons/lu";
import { IoChevronUp, IoChevronDown, IoChevronBack, IoChevronForward } from "react-icons/io5";

export default function ControlBar() {
    return (
        <div className="absolute bottom-4 left-4 right-4 flex items-stretch justify-between">

            {/* 좌하단: 키보드 가이드 */}
            <div className="flex items-stretch gap-4 rounded-2xl bg-[rgba(0,0,0,.6)] px-4 py-3">
                {/* 방향키 */}
                <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-1">
                        <div className="w-9" />
                        <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-white">
                            <IoChevronUp size={14} />
                        </button>
                        <div className="w-9" />
                    </div>
                    <div className="flex gap-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#18181b] text-[#52525b]">
                            <IoChevronBack size={12} />
                        </div>
                        <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-white">
                            <IoChevronDown size={14} />
                        </button>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#18181b] text-[#52525b]">
                            <IoChevronForward size={12} />
                        </div>
                    </div>
                    <button className="mt-0.5 w-full rounded-lg bg-[#27272a] py-1.5 text-[10px] font-bold tracking-widest text-white">
                        SPACE
                    </button>
                </div>

                {/* 단축키 설명 */}
                <div className="flex flex-col justify-center gap-3 text-[11px] text-[#a1a1aa]">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#27272a] text-[10px] font-bold text-white">↑</span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#27272a] text-[10px] font-bold text-white">↓</span>
                        <span>물품 이동</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 items-center justify-center rounded bg-[#27272a] px-2 text-[10px] font-bold text-white">SPACE</span>
                        <span>설명 시작</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 items-center justify-center rounded bg-[#27272a] px-2 text-[10px] font-bold text-white">↵</span>
                        <span>경매 시작</span>
                    </div>
                </div>
            </div>

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
