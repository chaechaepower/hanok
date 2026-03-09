import { FaCrown } from "react-icons/fa6";

const bids = [
    { time: "08:41", sec: "32", user: "고미술애호가", amount: "685,000원", isTop: true },
    { time: "08:39", sec: "15", user: "전통수집광", amount: "650,000원" },
    { time: "08:37", sec: "48", user: "Heritage_K", amount: "620,000원" },
    { time: "08:35", sec: "22", user: "도자기마니아", amount: "580,000원" },
    { time: "08:32", sec: "07", user: "전통수집광", amount: "520,000원" },
    { time: "08:30", sec: "51", user: "고미술애호가", amount: "480,000원" },
    { time: "08:28", sec: "33", user: "Heritage_K", amount: "450,000원" },
    { time: "08:25", sec: "19", user: "전통수집광", amount: "420,000원" },
    { time: "08:22", sec: "44", user: "도자기마니아", amount: "380,000원" },
    { time: "08:20", sec: "10", user: "옛날사람", amount: "350,000원" },
    { time: "08:18", sec: "56", user: "고미술애호가", amount: "320,000원" },
    { time: "08:15", sec: "28", user: "Heritage_K", amount: "280,000원" },
    { time: "08:12", sec: "03", user: "전통수집광", amount: "250,000원" },
    { time: "08:10", sec: "41", user: "도자기마니아", amount: "200,000원" },
    { time: "08:08", sec: "17", user: "고미술애호가", amount: "130,000원" },
];

export default function BidFeed() {
    return (
        <div className="mt-2 flex flex-col gap-2 border-t border-[rgba(255,255,255,.06)] pt-5">
            {/* 라벨 + 구분선 */}
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.06em] text-[#a1a1aa]">
                실시간 입찰
                <div className="h-px flex-1 bg-gradient-to-r from-[rgba(255,255,255,.08)] to-transparent" />
            </div>

            {/* 입찰 목록 */}
            <div className="bid-feed-scroll flex flex-col gap-1 overflow-y-auto">
                {bids.map((bid, idx) => (
                    <div
                        key={idx}
                        className={`flex min-h-9 items-center gap-2 rounded-xl px-2.5 ${bid.isTop
                            ? "border border-[rgba(197,160,89,.18)] bg-[rgba(197,160,89,.06)]"
                            : "border border-[rgba(255,255,255,.04)] bg-[rgba(255,255,255,.02)]"
                            }`}
                    >
                        <span className="flex w-8 shrink-0 flex-col items-center gap-0.5 tabular-nums">
                            <span className="text-[9px] font-semibold text-[#71717a]">{bid.time}</span>
                            <span className="text-[7px] font-medium text-[#52525b]">:{bid.sec}</span>
                        </span>
                        <span className={`w-[80px] shrink-0 overflow-hidden text-[11px] font-bold whitespace-nowrap text-ellipsis py-0.5 ${bid.isTop ? "text-white" : "text-[#a1a1aa]"}`}>
                            {bid.user}
                        </span>
                        <span className={`ml-auto shrink-0 font-mono text-[11px] font-black ${bid.isTop ? "text-[#C5A059]" : "text-[#71717a]"}`}>
                            {bid.amount}
                        </span>
                        {bid.isTop && (
                            <span className="flex shrink-0 items-center">
                                <FaCrown size={12} className="text-[#C5A059]" />
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
