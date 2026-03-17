import type { StompConnectionState } from '@/websocket/stompClient';
import type { ChatMessageType } from '@/types';

import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

interface Props {
  messages: ChatMessageType[];
  connectionState: StompConnectionState;
  onSendMessage: (message: string) => Promise<void>;
  onSendMacro: (command: string) => Promise<void>;
}

export default function ChatPanel({ messages, connectionState, onSendMessage, onSendMacro }: Props) {
  return (
    <div className="flex h-full flex-col">
      <ChatMessage messages={messages} connectionState={connectionState} />
      <ChatInput connectionState={connectionState} onSendMessage={onSendMessage} onSendMacro={onSendMacro} />
    </div>
  );
}
