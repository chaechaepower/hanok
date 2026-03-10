import { useState } from "react";
import ChatPanel from "@/components/Live/Chat/ChatPanel";
import SellerAuctionPanel from "@/components/Live/Auction/Seller/SellerAuctionPanel";

interface Props {
    isSeller: boolean;
}

export default function RightPanel({ isSeller }: Props) {
    const [activeTab, setActiveTab] = useState<"chat" | "auction">("chat");

    return (
        <div className="flex h-full w-full flex-col rounded-2xl bg-[#050505] text-point">
            {/* 판매자 프로필 헤더 */}
            <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#27272a] text-[10px] font-bold text-[#C5A059]">
                    Y
                </div>
                <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white">한옥 고미술 상점</div>
                    <div className="text-[8px] font-bold tracking-wider text-[#C5A059]">PREMIUM CURATOR</div>
                </div>
            </div>

            {/* 탭버튼 — 판매자만 경매 데이터 탭 표시 */}
            {isSeller ? (
                <div className="flex border-b border-[rgba(255,255,255,.05)]">
                    <button
                        className={`flex-1 py-3 text-[13px] font-bold transition ${activeTab === "chat" ? "border-b-2 border-[#C5A059] text-white" : "text-[#52525b]"}`}
                        onClick={() => setActiveTab("chat")}
                    >
                        실시간 채팅
                    </button>
                    <button
                        className={`flex-1 py-3 text-[13px] font-bold transition ${activeTab === "auction" ? "border-b-2 border-[#C5A059] text-white" : "text-[#52525b]"}`}
                        onClick={() => setActiveTab("auction")}
                    >
                        경매 데이터
                    </button>
                </div>
            ) : (
                <div className="flex border-b border-[rgba(255,255,255,.05)]">
                    <div className="flex-1 py-3 text-center text-[13px] font-bold border-b-2 border-[#C5A059] text-white">
                        실시간 채팅
                    </div>
                </div>
            )}

            {/* 탭에 따라 컴포넌트 표시 */}
            <div className="flex-1 overflow-y-auto">
                {isSeller && activeTab === "auction" ? <SellerAuctionPanel /> : <ChatPanel />}
            </div>
        </div>
    );
}
