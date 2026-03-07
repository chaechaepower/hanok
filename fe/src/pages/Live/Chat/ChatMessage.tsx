import type { ChatMessageType } from "@/types"

const dummyMessages: ChatMessageType[] = [
    { id: 1, type: "system", message: "경매가 시작되었습니다" },
    { id: 2, type: "chat", nickname: "고미술애호가", message: "상태 어떤가요? 오염 있나요?" },
    { id: 3, type: "macro_request", nickname: "전통수집광", command: "@사이즈" },
    { id: 4, type: "macro_response", label: "Seller Info", message: "해당 상품은 가로 45cm x 세로 60cm 입니다." },
    { id: 5, type: "chat", nickname: "도자기마니아", message: "색감이 정말 예술이네요..." },
    { id: 6, type: "macro_request", nickname: "골동품수집가", command: "@360도 보여주세요" },
];

export default function ChatMessage() {
    return (
        <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
            {dummyMessages.map((msg) => {
                if (msg.type === "system") {
                    return (
                        <div key={msg.id} className="text-center">
                            <span className="rounded-full bg-point/5 px-3 py-1 text-[10px] text-point/50">
                                {msg.message}
                            </span>
                        </div>
                    );
                }

                if (msg.type === "macro_request") {
                    return (
                        <div key={msg.id} className="flex flex-col items-start border-l-2 border-gold bg-gold/5 py-1 pl-3">
                            <div className="mb-1 flex items-center gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-tighter text-gold">Request</span>
                                <span className="text-[10px] font-medium text-gold/60">by {msg.nickname}</span>
                            </div>
                            <p className="text-[13px] font-semibold italic text-gold/90">
                                "{msg.command}"
                            </p>
                        </div>
                    );
                }

                if (msg.type === "macro_response") {
                    return (
                        <div key={msg.id} className="flex justify-end">
                            <div className="max-w-[90%] rounded-xl border border-blue-500/30 bg-blue-600/10 p-3">
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="text-[11px] font-bold uppercase text-blue-400">{msg.label}</span>
                                </div>
                                <p className="text-[13px] leading-snug text-blue-100">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={msg.id} className="flex flex-col">
                        <span className="mb-0.5 text-[11px] font-bold text-point/50">{msg.nickname}</span>
                        <p className="inline-block max-w-[85%] rounded-2xl rounded-tl-none border border-point/5 bg-point/5 px-3 py-2 text-[13px] text-point">
                            {msg.message}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
