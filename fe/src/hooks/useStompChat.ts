import { useCallback, useEffect, useRef, useState } from 'react';
import { useStomp } from './useStomp';
import { DESTINATION_PREFIX, MAX_CHAT_HISTORY } from '@/constants/stompChat';
import type {
  StompResponse,
  ChatSendPayload,
  MacroPayload,
  ChatMessageType,
} from '@/types/stompChat';

let chatIdCounter = 0;

export function useStompChat() {
  const { client, connectionState, streamId } = useStomp();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (connectionState !== 'connected' || !client) return;

    const destination = `${DESTINATION_PREFIX.BROADCAST}/streams/${streamId}`;

    subRef.current = client.subscribe(destination, (frame) => {
      const res: StompResponse<unknown> = JSON.parse(frame.body);

      let msg: ChatMessageType | null = null;

      switch (res.eventType) {
        case 'CHAT_MESSAGE': {
          const p = res.payload as { nickname: string; message: string };
          msg = {
            id: ++chatIdCounter,
            type: 'chat',
            nickname: p.nickname,
            message: p.message,
          };
          break;
        }
        case 'CHAT_FILTERED': {
          const p = res.payload as { nickname: string; message: string };
          msg = {
            id: ++chatIdCounter,
            type: 'chat',
            nickname: p.nickname,
            message: p.message,
          };
          break;
        }
        case 'MACRO_TEMPLATE': {
          const p = res.payload as { command?: string; label?: string; message?: string };
          if (p.label && p.message) {
            msg = {
              id: ++chatIdCounter,
              type: 'macro_response',
              label: p.label,
              message: p.message,
            };
          } else if (p.command) {
            msg = {
              id: ++chatIdCounter,
              type: 'macro_request',
              nickname: '',
              command: p.command,
            };
          }
          break;
        }
        case 'SYSTEM_NOTICE':
        case 'SYSTEM_STREAM_START':
        case 'SYSTEM_STREAM_END': {
          const p = res.payload as { message: string };
          msg = {
            id: ++chatIdCounter,
            type: 'system',
            message: p.message,
          };
          break;
        }
      }

      if (msg) {
        setMessages((prev) => {
          const next = [...prev, msg];
          return next.length > MAX_CHAT_HISTORY
            ? next.slice(next.length - MAX_CHAT_HISTORY)
            : next;
        });
      }
    });

    return () => {
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, [client, connectionState, streamId]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!client || connectionState !== 'connected') return;
      const body: ChatSendPayload = { message };
      client.publish({
        destination: `${DESTINATION_PREFIX.APP}/streams/${streamId}`,
        body: JSON.stringify({ eventType: 'CHAT_MESSAGE', payload: body }),
      });
    },
    [client, connectionState, streamId],
  );

  const sendMacro = useCallback(
    (command: string) => {
      if (!client || connectionState !== 'connected') return;
      const body: MacroPayload = { command };
      client.publish({
        destination: `${DESTINATION_PREFIX.APP}/streams/${streamId}`,
        body: JSON.stringify({ eventType: 'MACRO_TEMPLATE', payload: body }),
      });
    },
    [client, connectionState, streamId],
  );

  return { messages, sendMessage, sendMacro };
}
