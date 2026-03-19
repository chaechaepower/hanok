import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useGetMe } from '@/api/hooks/useGetMe';
import { getCategoryMacroCommandLabel, getCategoryMacroQuestionType } from '@/constants/macro';
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

export function useStompChat(category: string) {
  const { id: streamIdParam } = useParams<{ id: string }>();
  const streamId = streamIdParam ?? '';
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: me } = useGetMe({ enabled: isLoggedIn });
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

    let isDisposed = false;
    let unsubscribe: (() => void) | null = null;

    void subscribeStream<StompResponse<unknown>>({
      streamId,
      onBroadcast: (response) => {
        let nextMessage: ChatMessageType | null = null;

        switch (response.eventType) {
          case 'CHAT_MESSAGE':
          case 'CHAT_FILTERED': {
            const payload = response.payload as { nickname?: string; content?: string } | null;

            if (payload?.content) {
              nextMessage = {
                id: createMessageId(),
                type: 'chat',
                nickname: payload.nickname ?? 'guest',
                message: payload.content,
              };
            }
            break;
          }
          case 'MACRO_TEMPLATE': {
            const payload = response.payload as MacroTemplatePayload | null;

            if (payload?.questionType && typeof payload.answer === 'string') {
              nextMessage = {
                id: createMessageId(),
                type: 'macro_response',
                sender: '판매자',
                question: getCategoryMacroCommandLabel(category, payload.questionType),
                answer: payload.answer,
                createdAt: payload.createdAt,
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
        if (isDisposed) {
          cleanup();
          return;
        }

        unsubscribe = cleanup;
      })
      .catch((error) => {
        console.error('[chat] failed to subscribe', error);
      });

    return () => {
      isDisposed = true;
      unsubscribe?.();
    };
  }, [category, streamId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!streamId || !message.trim()) {
        return;
      }

      const payload: ChatSendPayload = { content: message.trim() };
      await sendStreamMessage(streamId, {
        eventType: 'CHAT_MESSAGE',
        payload,
      });
    },
    [streamId],
  );

  const sendMacro = useCallback(
    async (question: string) => {
      if (!streamId || !question.trim()) {
        return;
      }

      const mappedQuestionType = getCategoryMacroQuestionType(category, question);
      const normalizedQuestionType = mappedQuestionType ?? question.trim();
      const questionLabel = getCategoryMacroCommandLabel(category, normalizedQuestionType);

      setMessagesByStream((prev) => ({
        ...prev,
        [streamId]: appendMessage(prev[streamId] ?? [], {
          id: createMessageId(),
          type: 'macro_request',
          nickname: me?.nickname ?? '나',
          question: questionLabel,
        }),
      }));

      const payload: MacroPayload = { questionType: normalizedQuestionType };
      await sendStreamMessage(streamId, {
        eventType: 'MACRO_TEMPLATE',
        payload,
      });
    },
    [category, me?.nickname, streamId],
  );

  return { messages, sendMessage, sendMacro, connectionState, streamId };
}
