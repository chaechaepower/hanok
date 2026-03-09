export default function SellerStats() {
    return (
        <div className="space-y-4">
            <div className="text-center">
                <div className="text-xs text-point/50">오늘의 총 수익</div>
                <div className="text-2xl font-bold text-gold">W1,240,500</div>
                <div className="text-xs text-point/30">DAILY PERFORMANCE</div>
            </div>
            <div className="flex justify-around">
                <div className="text-center">
                    <div className="text-xs text-point/50">참여 입찰수</div>
                    <div className="text-xl font-bold">24 건</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-point/50">승률</div>
                    <div className="text-xl font-bold">~420%</div>
                </div>
            </div>
        </div>
    );
}
