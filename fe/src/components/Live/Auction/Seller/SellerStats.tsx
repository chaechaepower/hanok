import { FaArrowTrendUp } from "react-icons/fa6";

export default function SellerStats() {
    return (
        <div className="space-y-4">
            {/* TOTAL PERFORMANCE 카드 */}
            <div className="rounded-2xl bg-[#18181b] p-5">
                <div className="text-[10px] font-bold uppercase tracking-tigher text-[#71717a]">
                    TOTAL PERFORMANCE
                </div>
                <div className="mt-2 text-3xl font-black text-[#22c55e]">
                    <span className="mr-3">₩</span>
                    <span className="font-mono font-black">1,240,500</span>
                </div>
            </div>

            {/* 참여 입찰수 / 상승폭 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#18181b] p-4 text-center">
                    <div className="text-[10px] font-bold text-[#71717a]">참여 입찰수</div>
                    <div className="mt-1 text-xl font-black text-white">
                        <span className="font-mono font-black">24</span> <span className="text-sm font-normal text-[#52525b]">건</span>
                    </div>
                </div>
                <div className="rounded-2xl bg-[#18181b] p-4 text-center">
                    <div className="text-[10px] font-bold text-[#71717a]">상승폭</div>
                    <div className="mt-1 flex items-center justify-center gap-2 text-xl font-black text-[#ef4444]">
                        <FaArrowTrendUp size={17} />
                        <span className="font-mono font-black">420</span>
                        <span className="font-mono font-black">%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
