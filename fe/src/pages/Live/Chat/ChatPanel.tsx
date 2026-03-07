import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatPanel() {
    return (
        <div className="flex h-full flex-col">
            <ChatMessage />
            <ChatInput />
        </div>
    );
}
