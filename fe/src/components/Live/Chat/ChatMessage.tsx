import { useEffect, useRef } from 'react';

import type { ChatMessageType } from '@/types';
import type { StompConnectionState } from '@/websocket/stompClient';

interface Props {
  messages: ChatMessageType[];
  connectionState: StompConnectionState;
}

export default function ChatMessage({ messages, connectionState }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="chat-scroll flex flex-1 flex-col gap-2.5 overflow-y-auto p-4"
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-label font-medium tracking-wide text-neutral-700">
            {connectionState === 'connected'
              ? '채팅을 기다리고 있습니다.'
              : '채팅 연결 중입니다.'}
          </p>
        </div>
      ) : (
        messages.map((message) => {
          if (message.type === 'system') {
            return (
              <div key={message.id} className="self-center text-caption font-medium tracking-wide text-neutral-700">
                {message.message}
              </div>
            );
          }

          if (message.type === 'macro_request') {
            return (
              <div key={message.id} className="flex flex-col items-end">
                <span className="mb-0.5 px-1.5 text-caption font-bold text-neutral-600">{message.nickname}</span>
                <p className="inline-block max-w-[85%] rounded-[16px_4px_16px_16px] border border-gold/20 bg-gold/7 px-3 py-2 text-body-md italic text-gold/90">
                  {message.question}
                </p>
              </div>
            );
          }

          if (message.type === 'macro_response') {
            return (
              <div key={message.id} className="flex flex-col items-end">
                <span className="mb-0.5 px-1.5 text-caption font-bold text-neutral-600">판매자</span>
                <p className="inline-block max-w-[90%] rounded-[16px_4px_16px_16px] border border-primary/20 bg-primary/7 px-3 py-2 text-body-md leading-relaxed text-primary-light/90">
                  {message.answer}
                </p>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex flex-col items-start">
              <span className="mb-0.5 px-1.5 text-caption font-bold text-neutral-600">{message.nickname}</span>
              <p className="inline-block max-w-[85%] rounded-[4px_16px_16px_16px] border border-neutral-800 bg-neutral-900 px-3 py-2 text-body-md leading-relaxed text-neutral-200">
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
