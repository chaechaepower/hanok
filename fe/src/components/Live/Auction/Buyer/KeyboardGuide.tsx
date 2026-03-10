import { LuKeyboard } from "react-icons/lu";
import { IoChevronUp, IoChevronDown, IoChevronBack, IoChevronForward } from "react-icons/io5";

interface Props {
    open: boolean;
    onToggle: (open: boolean) => void;
}

export default function KeyboardGuide({ open, onToggle }: Props) {
    if (!open) {
        return (
            <div className="flex h-[130px] flex-col justify-center gap-3 rounded-2xl bg-[rgba(0,0,0,.6)] px-2.5">
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-[rgba(255,255,255,.1)]"
                    onClick={() => onToggle(true)}
                >
                    <LuKeyboard size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-stretch rounded-2xl bg-[rgba(0,0,0,.6)]">
            {/* 접기 버튼 */}
            <button
                className="flex w-8 items-center justify-center rounded-l-2xl text-[#71717a] transition hover:bg-[rgba(255,255,255,.05)] hover:text-white"
                onClick={() => onToggle(false)}
            >
                <IoChevronBack size={14} />
            </button>

            <div className="flex items-stretch gap-4 px-4 py-3">
                {/* 방향키 */}
                <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-1">
                        <div className="w-9" />
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-white">
                            <IoChevronUp size={14} />
                        </div>
                        <div className="w-9" />
                    </div>
                    <div className="flex gap-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-white">
                            <IoChevronBack size={12} />
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-white">
                            <IoChevronDown size={14} />
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-white">
                            <IoChevronForward size={12} />
                        </div>
                    </div>
                    <div className="mt-0.5 flex w-full gap-1">
                        <div className="flex-1 rounded-lg bg-[#3b82f6]/20 py-1.5 text-center text-[10px] font-bold tracking-widest text-[#60a5fa]">
                            ENTER
                        </div>
                        <span className="flex h-auto items-center justify-center px-1 text-[10px] text-[#a1a1aa]">
                            입찰
                        </span>
                    </div>
                </div>

                {/* 단축키 설명 */}
                <div className="flex flex-col justify-center gap-3 text-[11px] text-[#a1a1aa]">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 items-center justify-center rounded bg-[#27272a] px-2 text-[10px] font-bold text-white">Tab</span>
                        <span>탭 전환</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#27272a] text-[10px] font-bold text-white">↑</span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#27272a] text-[10px] font-bold text-white">↓</span>
                        <span>금액 조절</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#27272a] text-[10px] font-bold text-white">←</span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#27272a] text-[10px] font-bold text-white">→</span>
                        <span>단위 변경</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
