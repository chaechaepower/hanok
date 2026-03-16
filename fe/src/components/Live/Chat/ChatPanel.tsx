import { useStompChat } from '@/hooks/useStompChat';

import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

export default function ChatPanel() {
  const { messages, sendMessage, sendMacro, connectionState } = useStompChat();

  return (
    <div className="flex h-full flex-col">
      <ChatMessage messages={messages} connectionState={connectionState} />
      <ChatInput connectionState={connectionState} onSendMessage={sendMessage} onSendMacro={sendMacro} />
    </div>
  );
}
