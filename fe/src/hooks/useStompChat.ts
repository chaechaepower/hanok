import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { MAX_CHAT_HISTORY } from '@/constants/stompChat';
import type {
  ChatMessageType,
  ChatSendPayload,
  MacroPayload,
  MacroTemplatePayload,
  StompResponse,
} from '@/types';
import {
  getStompConnectionState,
  sendStreamMessage,
  subscribeStream,
  subscribeToStompConnectionState,
  type StompConnectionState,
} from '@/websocket/stompClient';

let chatIdCounter = 0;

const createMessageId = () => ++chatIdCounter;

const appendMessage = (messages: ChatMessageType[], message: ChatMessageType) => {
  const nextMessages = [...messages, message];

  if (nextMessages.length <= MAX_CHAT_HISTORY) {
    return nextMessages;
  }

  return nextMessages.slice(nextMessages.length - MAX_CHAT_HISTORY);
};

export function useStompChat() {
  const { id: streamIdParam } = useParams<{ id: string }>();
  const streamId = streamIdParam ?? '';
  const [messagesByStream, setMessagesByStream] = useState<Record<string, ChatMessageType[]>>({});
  const [connectionState, setConnectionState] = useState<StompConnectionState>(getStompConnectionState());
  const messages = messagesByStream[streamId] ?? [];

  useEffect(() => {
    return subscribeToStompConnectionState(setConnectionState);
  }, []);

  useEffect(() => {
    if (!streamId) {
      return;
    }

    let unsubscribe: (() => void) | null = null;

    void subscribeStream<StompResponse<unknown>>({
      streamId,
      onBroadcast: (response) => {
        let nextMessage: ChatMessageType | null = null;

        switch (response.eventType) {
          case 'CHAT_MESSAGE':
          case 'CHAT_FILTERED': {
            const payload = response.payload as { nickname?: string; message?: string } | null;

            if (payload?.message) {
              nextMessage = {
                id: createMessageId(),
                type: 'chat',
                nickname: payload.nickname ?? '익명',
                message: payload.message,
              };
            }
            break;
          }
          case 'MACRO_TEMPLATE': {
            const payload = response.payload as MacroTemplatePayload | null;

            if (payload?.label && payload.message) {
              nextMessage = {
                id: createMessageId(),
                type: 'macro_response',
                label: payload.label,
                message: payload.message,
              };
            } else if (payload?.command) {
              nextMessage = {
                id: createMessageId(),
                type: 'macro_request',
                nickname: payload.nickname ?? '나',
                command: payload.command,
              };
            }
            break;
          }
          case 'SYSTEM_NOTICE':
          case 'SYSTEM_STREAM_START':
          case 'SYSTEM_STREAM_END': {
            const payload = response.payload as { message?: string } | null;

            if (payload?.message) {
              nextMessage = {
                id: createMessageId(),
                type: 'system',
                message: payload.message,
              };
            }
            break;
          }
          default:
            break;
        }

        if (!nextMessage) {
          return;
        }

        setMessagesByStream((prev) => ({
          ...prev,
          [streamId]: appendMessage(prev[streamId] ?? [], nextMessage),
        }));
      },
    })
      .then((cleanup) => {
        unsubscribe = cleanup;
      })
      .catch((error) => {
        console.error('[chat] failed to subscribe', error);
      });

    return () => {
      unsubscribe?.();
    };
  }, [streamId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!streamId || !message.trim()) {
        return;
      }

      const payload: ChatSendPayload = { message: message.trim() };
      await sendStreamMessage(streamId, {
        eventType: 'CHAT_MESSAGE',
        payload,
      });
    },
    [streamId],
  );

  const sendMacro = useCallback(
    async (command: string) => {
      if (!streamId || !command.trim()) {
        return;
      }

      const payload: MacroPayload = { command: command.trim() };
      await sendStreamMessage(streamId, {
        eventType: 'MACRO_TEMPLATE',
        payload,
      });
    },
    [streamId],
  );

  return { messages, sendMessage, sendMacro, connectionState, streamId };
}
