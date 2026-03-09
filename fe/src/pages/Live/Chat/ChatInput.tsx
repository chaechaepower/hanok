import { useRef } from "react";
import { RiSendPlaneLine } from "react-icons/ri";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const macros = [
    "@사이즈", "@360도", "@소재", "@배송", "@진품인증",
    "@상태", "@무게", "@보증서", "@출처", "@포장",
];

export default function ChatInput() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const amount = direction === "left" ? -120 : 120;
            scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
        }
    };

    return (
        <div className="border-t border-point/5 bg-background p-4">
            {/* 매크로 버튼 (스크롤 가능) */}
            <div className="mb-3 flex items-center gap-1">
                <button
                    onClick={() => scroll("left")}
                    className="shrink-0 text-point/30 hover:text-point"
                >
                    <IoChevronBack size={14} />
                </button>
                <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: "none" }}
                >
                    {macros.map((macro) => (
                        <button
                            key={macro}
                            className="shrink-0 rounded-full border border-point/10 bg-point/5 px-3 py-1 text-[10px] font-semibold text-point/50 transition-all hover:bg-point/10 hover:text-point"
                        >
                            {macro}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => scroll("right")}
                    className="shrink-0 text-point/30 hover:text-point"
                >
                    <IoChevronForward size={14} />
                </button>
            </div>

            {/* 입력창 */}
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder="채팅하기..."
                    className="w-full rounded-xl bg-[#2a2a2a] px-4 py-3 text-[13px] text-point placeholder:text-point/30 focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
                <button className="absolute right-3 text-gold transition hover:scale-110">
                    <RiSendPlaneLine size={16} />
                </button>
            </div>
        </div>
    );
}
