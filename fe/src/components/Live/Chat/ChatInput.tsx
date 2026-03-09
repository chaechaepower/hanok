import { useRef, useEffect } from "react";
import { IoIosSend } from "react-icons/io";
import { BsEmojiSmile } from "react-icons/bs";

const macros = [
    "@사이즈", "@360도", "@소재", "@배송", "@진품인증",
    "@상태", "@무게", "@보증서", "@출처", "@포장",
];

export default function ChatInput() {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, []);

    return (
        <div className="border-t border-[rgba(255,255,255,.07)] bg-[rgba(24,24,27,.5)] px-4 py-3.5">
            {/* 매크로 버튼 (스크롤 + 오른쪽 페이드) */}
            <div className="relative mb-2.5">
                <div
                    ref={scrollRef}
                    className="macro-scroll flex gap-[7px] overflow-x-auto pb-2.5"
                >
                    {macros.map((macro) => (
                        <button
                            key={macro}
                            className="shrink-0 rounded-full border border-[rgba(255,255,255,.05)] bg-[#27272a] px-3 py-1.5 text-[10px] font-bold text-[#a1a1aa] transition-all hover:border-[#C5A059] hover:text-white"
                        >
                            {macro}
                        </button>
                    ))}
                </div>
                {/* 오른쪽 페이드 그라데이션 */}
                <div className="pointer-events-none absolute right-0 top-0 bottom-2.5 w-10 bg-gradient-to-r from-transparent to-[rgba(24,24,27,.95)]" />
            </div>

            {/* 입력창 */}
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    className="w-full rounded-2xl border border-[rgba(255,255,255,.1)] bg-black px-4 py-3 pr-20 text-[13px] text-white placeholder:text-[#52525b] focus:border-[#C5A059] focus:outline-none"
                />
                <div className="absolute right-3 flex items-center gap-2">
                    <button className="text-[#a1a1aa] transition hover:scale-110 hover:text-white">
                        <BsEmojiSmile size={14} />
                    </button>
                    <button className="text-[#C5A059] transition hover:scale-110">
                        <IoIosSend size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
