import { RiRefreshLine } from "react-icons/ri";
import { BsCheck } from "react-icons/bs";

export default function InventoryList() {
    return (
        <div className="flex h-full w-80 flex-col rounded-xl bg-background p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-point">오늘의 출품 목록</h2>
                    <span className="rounded-full bg-gold px-2 py-0.5 text-sm text-background">15</span>
                </div>
                <RiRefreshLine className="h-5 w-5 text-point" />
            </div>

            {/* 물품 카드 */}
            <div className="mt-4 flex-1 overflow-y-auto">
                <h4 className="text-sm text-point">대기 중인 물품 (9)</h4>
                <div className="mt-2 flex flex-col gap-2">

                    {/* 진행중 카드 */}
                    <div className="flex gap-3 rounded-lg border border-gold bg-gold/10 p-3">
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-700" />
                        <div className="flex flex-1 flex-col justify-center">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-point">청자 투각 칠보문 피로</span>
                                <BsCheck className="h-4 w-4 text-gold" />
                            </div>
                            <span className="text-sm text-gold">130,000원</span>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">새상품</span>
                                <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] text-background">진행중</span>
                            </div>
                        </div>
                    </div>

                    {/* 대기중 카드 */}
                    <div className="flex gap-3 rounded-lg border border-gray-700 p-3">
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-700" />
                        <div className="flex flex-1 flex-col justify-center">
                            <span className="text-sm text-point">전통 자수 병풍 세트</span>
                            <span className="text-sm text-gold">2,450,000원</span>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">거의새것</span>
                                <span className="rounded-full bg-gray-600 px-2 py-0.5 text-[10px] text-point">대기중</span>
                            </div>
                        </div>
                    </div>

                    {/* 대기중 카드 */}
                    <div className="flex gap-3 rounded-lg border border-gray-700 p-3">
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-700" />
                        <div className="flex flex-1 flex-col justify-center">
                            <span className="text-sm text-point">고가구 머릿장</span>
                            <span className="text-sm text-gold">850,000원</span>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">중고</span>
                                <span className="rounded-full bg-gray-600 px-2 py-0.5 text-[10px] text-point">대기중</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 구분선 */}
            <div className="my-3 border-t border-gray-700" />

            {/* 낙찰 완료 */}
            <div className="overflow-y-auto">
                <h4 className="text-sm text-point">낙찰 완료 (3)</h4>
                <div className="mt-2 flex flex-col gap-2">
                    <div className="relative flex gap-3 rounded-lg border border-gray-700 p-3">
                        <div className="absolute inset-0 rounded-lg bg-background/70" />
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-700" />
                        <div className="flex flex-1 flex-col justify-center">
                            <span className="text-sm text-point">백자 달항아리</span>
                            <span className="text-sm text-gold">낙찰가: 5,500,000원</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
