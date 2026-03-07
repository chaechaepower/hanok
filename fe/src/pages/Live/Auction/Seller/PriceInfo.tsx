export default function PriceInfo() {
    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="text-xs text-point/50">시작가</div>
                <div className="text-sm">130,000</div>
            </div>
            <div className="text-right">
                <div className="text-xs text-point/50">현재 최고가</div>
                <div className="text-2xl font-bold text-gold">685,000원</div>
            </div>
        </div>
    );
}
