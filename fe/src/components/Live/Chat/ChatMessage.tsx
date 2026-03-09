import type { ChatMessageType } from "@/types";

const dummyMessages: ChatMessageType[] = [
    { id: 1, type: "system", message: "한옥 고미술 경매에 오신 것을 환영합니다." },
    { id: 2, type: "chat", nickname: "고미술애호가", message: "이거 보관 상태가 어떻게 되나요?" },
    { id: 3, type: "macro_request", nickname: "나", command: "@소재" },
    { id: 4, type: "macro_request", nickname: "나", command: "@작가소개" },
    { id: 5, type: "macro_response", label: "Seller", message: "순도 높은 청자토를 사용하였으며, 유약은 전통 비색 기법으로 시유되었습니다." },
    { id: 6, type: "macro_response", label: "Seller", message: "이 작품은 국가무형문화재 보유자의 감정을 통과한 인증 작품입니다." },
];

export default function ChatMessage() {
    return (
        <div className="chat-scroll flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
            {dummyMessages.map((msg) => {
                if (msg.type === "system") {
                    return (
                        <div key={msg.id} className="self-center text-[10px] font-medium tracking-wide text-[#3f3f46]">
                            {msg.message}
                        </div>
                    );
                }

                if (msg.type === "macro_request") {
                    return (
                        <div key={msg.id} className="flex flex-col items-end">
                            <span className="mb-0.5 px-1.5 text-[10px] font-bold text-[#52525b]">{msg.nickname}</span>
                            <p className="inline-block max-w-[85%] rounded-[16px_4px_16px_16px] border border-[rgba(197,160,89,.2)] bg-[rgba(197,160,89,.07)] px-3 py-2 text-[13px] italic text-[rgba(197,160,89,.9)]">
                                {msg.command}
                            </p>
                        </div>
                    );
                }

                if (msg.type === "macro_response") {
                    return (
                        <div key={msg.id} className="flex flex-col items-end">
                            <span className="mb-0.5 px-1.5 text-[10px] font-bold text-[#52525b]">{msg.label}</span>
                            <p className="inline-block max-w-[90%] rounded-[16px_4px_16px_16px] border border-[rgba(59,130,246,.2)] bg-[rgba(59,130,246,.07)] px-3 py-2 text-[13px] leading-relaxed text-[rgba(191,219,254,.9)]">
                                {msg.message}
                            </p>
                        </div>
                    );
                }

                return (
                    <div key={msg.id} className="flex flex-col items-start">
                        <span className="mb-0.5 px-1.5 text-[10px] font-bold text-[#52525b]">{msg.nickname}</span>
                        <p className="inline-block max-w-[85%] rounded-[4px_16px_16px_16px] border border-[rgba(255,255,255,.05)] bg-[#18181b] px-3 py-2 text-[13px] leading-relaxed text-[#e4e4e7]">
                            {msg.message}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
