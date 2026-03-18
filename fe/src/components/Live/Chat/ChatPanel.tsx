import type { ChatMessageType } from '@/types';
import type { StompConnectionState } from '@/websocket/stompClient';

import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

interface Props {
  streamId: number;
  category: string;
  messages: ChatMessageType[];
  connectionState: StompConnectionState;
  onSendMessage: (message: string) => Promise<void>;
  onSendMacro: (command: string) => Promise<void>;
}

export default function ChatPanel({
  streamId,
  category,
  messages,
  connectionState,
  onSendMessage,
  onSendMacro,
}: Props) {
  return (
    <div className="flex h-full flex-col">
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
