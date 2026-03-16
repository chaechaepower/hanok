import type { AuctionStatisticsPayload } from "@/types";

interface Props {
    auctionStatistics: AuctionStatisticsPayload | null;
}

function formatPrice(value: number) {
    return value.toLocaleString("ko-KR");
}

export default function PriceInfo({ auctionStatistics }: Props) {
    return (
        <div className="border-t border-white/5 pt-4">
            <div className="flex items-center justify-between">
                <div className="text-[11px] text-neutral-600">시작가격</div>
                <div className="text-sm font-bold text-white"><span className="font-mono font-black">{formatPrice(auctionStatistics?.startPrice ?? 0)}</span>원</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <div className="text-[11px] text-neutral-600">현재 최고가</div>
                <div className="text-xl font-black text-gold"><span className="font-mono font-black">{formatPrice(auctionStatistics?.currentPrice ?? 0)}</span>원</div>
            </div>
        </div>
    );
}
