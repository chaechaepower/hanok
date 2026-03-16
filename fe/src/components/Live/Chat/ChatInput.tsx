import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
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
  const pickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);
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

  useEffect(() => {
    if (!showPicker) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiButtonRef.current?.contains(target)) {
        return;
      }
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

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

  const handleEmojiSelect = (emoji: { native: string }) => {
    setMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="relative border-t border-neutral-800 bg-background px-4 py-3.5">
      <div className="relative mb-2.5">
        <div ref={scrollRef} className="macro-scroll flex gap-[7px] overflow-x-auto pb-2.5">
          {macros.map((macro) => (
            <button
              key={macro}
              type="button"
              disabled={!isConnected}
              onClick={() => void handleMacroClick(macro)}
              className="shrink-0 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-[10px] font-bold text-neutral-400 transition-all hover:border-gold hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {macro}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-2.5 right-0 top-0 w-10 bg-gradient-to-r from-transparent to-background" />
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
          className="w-full rounded-2xl border-none bg-surface-elevated px-4 py-3 pr-20 text-[13px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
        />
        <div className="absolute right-3 flex items-center gap-2">
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            className={`transition hover:scale-110 ${showPicker ? 'text-gold' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <BsEmojiSmile size={14} />
          </button>
          <button
            type="button"
            disabled={!isConnected || !message.trim()}
            onClick={() => void handleSubmit()}
            className="text-gold transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IoIosSend size={16} />
          </button>
        </div>
      </div>

      {showPicker && (
        <div ref={pickerRef} className="absolute bottom-full right-0 z-50 mb-2">
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="dark"
            locale="ko"
            previewPosition="none"
            skinTonePosition="none"
            perLine={7}
          />
        </div>
      )}
    </div>
  );
}
