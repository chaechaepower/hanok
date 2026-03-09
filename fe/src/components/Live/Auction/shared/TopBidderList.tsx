const bidders = [
    { rank: 1, initial: "고", nickname: "고미술애호가", price: "685,000원" },
    { rank: 2, initial: "전", nickname: "전통수집광", price: "650,000원" },
    { rank: 3, initial: "H", nickname: "Heritage_K", price: "620,000원" },
];

// 시상대 순서: 2등 → 1등 → 3등
const podiumOrder = [bidders[1], bidders[0], bidders[2]];

const rankStyles = {
    1: {
        avatar: "h-10 w-10 border-[#C5A059] bg-[rgba(197,160,89,.08)] text-[#C5A059]",
        name: "text-white",
        price: "text-[11px] text-[#C5A059]",
        block: "h-11 bg-[rgba(197,160,89,.12)] border border-b-0 border-[rgba(197,160,89,.25)] text-[#C5A059]",
    },
    2: {
        avatar: "h-[34px] w-[34px] border-[rgba(180,180,200,.3)] bg-[#27272a] text-[#c0c0c0]",
        name: "text-[#a1a1aa]",
        price: "text-[10px] text-[#71717a]",
        block: "h-[30px] bg-[rgba(180,180,200,.06)] border border-b-0 border-[rgba(180,180,200,.12)] text-[#c0c0c0]",
    },
    3: {
        avatar: "h-[34px] w-[34px] border-[rgba(180,120,60,.3)] bg-[#27272a] text-[#b87040]",
        name: "text-[#a1a1aa]",
        price: "text-[10px] text-[#71717a]",
        block: "h-5 bg-[rgba(180,120,60,.06)] border border-b-0 border-[rgba(180,120,60,.12)] text-[#b87040]",
    },
};

export default function TopBidderList() {
    return (
        <div className="border-b border-[rgba(255,255,255,.05)] bg-[rgba(24,24,27,.3)] px-4 pt-4">
            <div className="mb-3.5 text-[10px] font-black uppercase text-[#C5A059]">
                상위 입찰자
            </div>
            <div className="flex items-end justify-center gap-1.5">
                {podiumOrder.map((bidder) => {
                    const s = rankStyles[bidder.rank as keyof typeof rankStyles];
                    return (
                        <div key={bidder.rank} className="flex flex-1 flex-col items-center gap-1.5">
                            {/* 아바타 */}
                            <div className={`flex items-center justify-center rounded-full border-2 text-[11px] font-black ${s.avatar}`}>
                                {bidder.initial}
                            </div>
                            {/* 닉네임 */}
                            <div className={`max-w-[80px] truncate text-center text-[9px] font-bold ${s.name}`}>
                                {bidder.nickname}
                            </div>
                            {/* 가격 */}
                            <div className={`font-mono font-black ${s.price}`}>
                                {bidder.price}
                            </div>
                            {/* 시상대 블록 */}
                            <div className={`flex w-full items-center justify-center rounded-t-[10px] text-base font-black ${s.block}`}>
                                {bidder.rank}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
