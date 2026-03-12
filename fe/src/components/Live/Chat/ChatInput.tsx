import { useEffect, useRef, useState } from 'react';
import { BsEmojiSmile } from 'react-icons/bs';
import { IoIosSend } from 'react-icons/io';

import type { StompConnectionState } from '@/websocket/stompClient';

const macros = ['@사이즈', '@360도', '@소재', '@배송', '@진품인증', '@상태', '@무게', '@보증서', '@출처', '@작가소개'];

interface Props {
  connectionState: StompConnectionState;
  onSendMessage: (message: string) => Promise<void>;
  onSendMacro: (command: string) => Promise<void>;
}

export default function ChatInput({ connectionState, onSendMessage, onSendMacro }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const isConnected = connectionState === 'connected';

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    };

    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || !isConnected) {
      return;
    }

    await onSendMessage(message);
    setMessage('');
  };

  const handleMacroClick = async (macro: string) => {
    if (!isConnected) {
      return;
    }

    await onSendMacro(macro);
  };

  return (
    <div className="border-t border-[rgba(255,255,255,.07)] bg-[rgba(24,24,27,.5)] px-4 py-3.5">
      <div className="relative mb-2.5">
        <div ref={scrollRef} className="macro-scroll flex gap-[7px] overflow-x-auto pb-2.5">
          {macros.map((macro) => (
            <button
              key={macro}
              type="button"
              disabled={!isConnected}
              onClick={() => void handleMacroClick(macro)}
              className="shrink-0 rounded-full border border-[rgba(255,255,255,.05)] bg-[#27272a] px-3 py-1.5 text-[10px] font-bold text-[#a1a1aa] transition-all hover:border-[#C5A059] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {macro}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-2.5 right-0 top-0 w-10 bg-gradient-to-r from-transparent to-[rgba(24,24,27,.95)]" />
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          value={message}
          disabled={!isConnected}
          placeholder={isConnected ? '메시지를 입력하세요..' : '채팅 연결 중입니다..'}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          className="w-full rounded-2xl border border-[rgba(255,255,255,.1)] bg-black px-4 py-3 pr-20 text-[13px] text-white placeholder:text-[#52525b] focus:border-[#C5A059] focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
        />
        <div className="absolute right-3 flex items-center gap-2">
          <button type="button" className="text-[#a1a1aa] transition hover:scale-110 hover:text-white">
            <BsEmojiSmile size={14} />
          </button>
          <button
            type="button"
            disabled={!isConnected || !message.trim()}
            onClick={() => void handleSubmit()}
            className="text-[#C5A059] transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IoIosSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
