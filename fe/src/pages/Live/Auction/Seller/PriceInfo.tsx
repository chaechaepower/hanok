export default function PriceInfo() {
    return (
        <div className="border-t border-[rgba(255,255,255,.05)] pt-4">
            <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#52525b]">시작가격</div>
                <div className="text-sm font-bold text-white"><span className="font-mono font-black">130,000</span>원</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <div className="text-[11px] text-[#52525b]">현재 최고가</div>
                <div className="text-xl font-black text-[#C5A059]"><span className="font-mono font-black">685,000</span>원</div>
            </div>
        </div>
    );
}
