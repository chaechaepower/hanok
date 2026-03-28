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

const createChatMessage = (
  payload: { nickname?: string; content?: string } | null,
): ChatMessageType | null => {
  if (!payload?.content) {
    return null;
  }

  return {
    id: createMessageId(),
    type: 'chat',
    nickname: payload.nickname ?? 'guest',
    message: payload.content,
  };
};

const createSystemMessage = (payload: { message?: string } | null): ChatMessageType | null => {
  if (!payload?.message) {
    return null;
  }

  return {
    id: createMessageId(),
    type: 'system',
    message: payload.message,
  };
};

const createMacroResponseMessage = (
  category: string,
  payload: MacroTemplatePayload,
): ChatMessageType | null => {
  if (!payload.questionType || typeof payload.answer !== 'string') {
    return null;
  }

  return {
    id: createMessageId(),
    type: 'macro_response',
    sender: '판매자',
    question: getCategoryMacroCommandLabel(category, payload.questionType),
    answer: payload.answer,
    createdAt: payload.createdAt,
  };
};

const createBroadcastMessage = (
  response: StompResponse<unknown>,
): ChatMessageType | null => {
  switch (response.eventType) {
    case 'CHAT_MESSAGE':
    case 'CHAT_FILTERED':
      return createChatMessage(response.payload as { nickname?: string; content?: string } | null);
    case 'SYSTEM_NOTICE':
    case 'SYSTEM_STREAM_START':
    case 'SYSTEM_STREAM_END':
      return createSystemMessage(response.payload as { message?: string } | null);
    default:
      return null;
  }
};

export function useStompChat(category: string) {
  const { id: streamIdParam } = useParams<{ id: string }>();
  const streamId = streamIdParam ?? '';
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: me } = useGetMe({ enabled: isLoggedIn });
  const [messagesByStream, setMessagesByStream] = useState<Record<string, ChatMessageType[]>>({});
  const [connectionState, setConnectionState] = useState<StompConnectionState>(getStompConnectionState());
  const messages = messagesByStream[streamId] ?? [];

  const appendMessageForStream = useCallback((nextMessage: ChatMessageType | null) => {
    if (!streamId || !nextMessage) {
      return;
    }

    setMessagesByStream((prev) => ({
      ...prev,
      [streamId]: appendMessage(prev[streamId] ?? [], nextMessage),
    }));
  }, [streamId]);

  useEffect(() => {
    return subscribeToStompConnectionState(setConnectionState);
  }, []);

  useEffect(() => {
    if (!streamId) {
      return;
    }

    let isDisposed = false;
    let unsubscribe: (() => void) | null = null;

    void subscribeStream<StompResponse<unknown>, StompResponse<MacroTemplatePayload>>({
      streamId,
      onBroadcast: (response) => {
        appendMessageForStream(createBroadcastMessage(response));
      },
      onPrivate: (response) => {
        if (response.eventType !== 'MACRO_TEMPLATE') {
          return;
        }

        appendMessageForStream(createMacroResponseMessage(category, response.payload));
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
  }, [appendMessageForStream, category, streamId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!isLoggedIn || !streamId || !message.trim()) {
        return;
      }

      const payload: ChatSendPayload = { content: message.trim() };
      await sendStreamMessage(streamId, {
        eventType: 'CHAT_MESSAGE',
        payload,
      });
    },
    [isLoggedIn, streamId],
  );

  const sendMacro = useCallback(
    async (question: string) => {
      if (!isLoggedIn || !streamId || !question.trim()) {
        return;
      }

      const mappedQuestionType = getCategoryMacroQuestionType(category, question);
      const normalizedQuestionType = mappedQuestionType ?? question.trim();
      const questionLabel = getCategoryMacroCommandLabel(category, normalizedQuestionType);

      appendMessageForStream({
        id: createMessageId(),
        type: 'macro_request',
        nickname: me?.nickname ?? '나',
        question: questionLabel,
      });

      const payload: MacroPayload = { questionType: normalizedQuestionType };
      await sendStreamMessage(streamId, {
        eventType: 'MACRO_TEMPLATE',
        payload,
      });
    },
    [appendMessageForStream, category, isLoggedIn, me?.nickname, streamId],
  );

  return { messages, sendMessage, sendMacro, connectionState, streamId };
}
