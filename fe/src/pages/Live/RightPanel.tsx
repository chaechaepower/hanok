import {useState} from "react";
import ChatPanel from "./Chat/ChatPanel";
import AuctionPanel from "./Auction/AuctionPanel";

export default function RightPanel() {
    const [activeTab, setActiveTab] = useState<"chat" | "auction">("chat");

    return (
        <div className="flex h-full w-80 flex-col rounded-xl bg-background text-point">
            {/* 판매자 프로필 헤더 */}
            <div className="flex items-center gap-2 border-b border-gold/30 p-3">
                <div className="h-8 w-8 rounded-full bg-gold/40" />
                <div>
                    <div className="text-sm font-bold">한옥 고미술 상점</div>
                    <div className="text-xs text-gold">PREMIUM CURATOR</div>
                </div>
            </div>

            {/* 탭버튼 */}
            <div className="flex">
                <button
                    className={`flex-1 py-3 text-sm ${activeTab === "chat" ? "border-b-2 border-gold font-bold text-gold" : "text-point/50"}`}
                    onClick={() => setActiveTab("chat")}
                >
                    실시간 채팅
                </button>
                <button
                    className={`flex-1 py-3 text-sm ${activeTab === "auction" ? "border-b-2 border-gold font-bold text-gold" : "text-point/50"}`}
                    onClick={() => setActiveTab("auction")}
                >
                    경매 대시보드
                </button>
            </div>

            {/* 탭에 따라 컴포넌트 표시 */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "chat" ? <ChatPanel /> : <AuctionPanel />}
            </div>
        </div>
    );
}