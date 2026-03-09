export default function TopBidderList() {
    return (
        <div>
            <div className="mb-2 text-xs text-point/50">상위 입찰 3명</div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm">고미술애호가</span>
                    <span className="text-sm font-bold text-gold">685,000원</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm">전통수집광</span>
                    <span className="text-sm font-bold text-gold">650,000원</span>
                </div>
            </div>
        </div>
    );
}
