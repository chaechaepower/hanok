import type { ChatMessageType } from '@/types';
import type { StompConnectionState } from '@/websocket/stompClient';

import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

interface Props {
  streamId: number;
  category: string;
  notice: string | null;
  messages: ChatMessageType[];
  connectionState: StompConnectionState;
  onSendMessage: (message: string) => Promise<void>;
  onSendMacro: (command: string) => Promise<void>;
}

export default function ChatPanel({
  streamId,
  category,
  notice,
  messages,
  connectionState,
  onSendMessage,
  onSendMacro,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      {notice && (
        <div className="shrink-0 border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <span className="shrink-0 rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-caption font-black tracking-[0.12em] text-gold">
              공지
            </span>
            <p className="min-w-0 text-body-sm leading-5 font-medium text-neutral-200">{notice}</p>
          </div>
        </div>
      )}
      <ChatMessage messages={messages} connectionState={connectionState} />
      <ChatInput
        streamId={streamId}
        category={category}
        connectionState={connectionState}
        onSendMessage={onSendMessage}
        onSendMacro={onSendMacro}
      />
    </div>
  );
}
