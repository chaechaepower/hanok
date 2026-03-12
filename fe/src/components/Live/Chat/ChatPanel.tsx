import type { StreamEnterTopBidder } from '@/types';
import { useStompChat } from '@/hooks/useStompChat';

import TopBidderList from '../Auction/shared/TopBidderList';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

interface Props {
  topBidders?: StreamEnterTopBidder[];
}

export default function ChatPanel({ topBidders }: Props) {
  const { messages, sendMessage, sendMacro, connectionState } = useStompChat();

  return (
    <div className="flex h-full flex-col">
      <TopBidderList topBidders={topBidders} />
      <ChatMessage messages={messages} connectionState={connectionState} />
      <ChatInput connectionState={connectionState} onSendMessage={sendMessage} onSendMacro={sendMacro} />
    </div>
  );
}
