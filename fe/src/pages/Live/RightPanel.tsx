import {useState} from "react";
import ChatPanel from "@/components/Live/Chat/ChatPanel";
import SellerAuctionPanel from "@/components/Live/Auction/Seller/SellerAuctionPanel";

export default function RightPanel() {
    const [activeTab, setActiveTab] = useState<"chat" | "auction">("chat");

    return (
        <div className="flex h-full w-80 flex-col rounded-xl bg-[#050505] text-point">
            {/* 판매자 프로필 헤더 */}
            <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#27272a] text-sm font-bold text-[#C5A059]">
                    Y
                </div>
                <div>
                    <div className="text-sm font-bold text-white">한옥 고미술 상점</div>
                    <div className="text-[10px] font-bold tracking-wider text-[#C5A059]">PREMIUM CURATOR</div>
                </div>
            </div>

            {/* 탭버튼 */}
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

            {/* 탭에 따라 컴포넌트 표시 */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "chat" ? <ChatPanel /> : <SellerAuctionPanel />}
            </div>
        </div>
    );
}
