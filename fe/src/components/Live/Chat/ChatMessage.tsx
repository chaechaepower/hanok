import { useEffect, useRef } from 'react';

import type { ChatMessageType } from '@/types';
import type { StompConnectionState } from '@/websocket/stompClient';

interface Props {
  messages: ChatMessageType[];
  connectionState: StompConnectionState;
}

export default function ChatMessage({ messages, connectionState }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className="chat-scroll flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-[11px] font-medium tracking-wide text-[#3f3f46]">
            {connectionState === 'connected' ? '아직 도착한 채팅이 없습니다.' : '채팅 서버에 연결 중입니다.'}
          </p>
        </div>
      ) : (
        messages.map((message) => {
          if (message.type === 'system') {
            return (
              <div key={message.id} className="self-center text-[10px] font-medium tracking-wide text-[#3f3f46]">
                {message.message}
              </div>
            );
          }

          if (message.type === 'macro_request') {
            return (
              <div key={message.id} className="flex flex-col items-end">
                <span className="mb-0.5 px-1.5 text-[10px] font-bold text-[#52525b]">{message.nickname}</span>
                <p className="inline-block max-w-[85%] rounded-[16px_4px_16px_16px] border border-[rgba(197,160,89,.2)] bg-[rgba(197,160,89,.07)] px-3 py-2 text-[13px] italic text-[rgba(197,160,89,.9)]">
                  {message.command}
                </p>
              </div>
            );
          }

          if (message.type === 'macro_response') {
            return (
              <div key={message.id} className="flex flex-col items-end">
                <span className="mb-0.5 px-1.5 text-[10px] font-bold text-[#52525b]">{message.label}</span>
                <p className="inline-block max-w-[90%] rounded-[16px_4px_16px_16px] border border-[rgba(59,130,246,.2)] bg-[rgba(59,130,246,.07)] px-3 py-2 text-[13px] leading-relaxed text-[rgba(191,219,254,.9)]">
                  {message.message}
                </p>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex flex-col items-start">
              <span className="mb-0.5 px-1.5 text-[10px] font-bold text-[#52525b]">{message.nickname}</span>
              <p className="inline-block max-w-[85%] rounded-[4px_16px_16px_16px] border border-[rgba(255,255,255,.05)] bg-[#18181b] px-3 py-2 text-[13px] leading-relaxed text-[#e4e4e7]">
                {message.message}
              </p>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
