import type { ChatMessageType } from './live';

export type StompType =
  | 'CHAT_MESSAGE'
  | 'CHAT_FILTERED'
  | 'SYSTEM_NOTICE'
  | 'SYSTEM_STREAM_START'
  | 'SYSTEM_STREAM_END'
  | 'MACRO_TEMPLATE';

export interface StompRequest<T> {
  eventType: StompType;
  payload: T;
}

export interface StompResponse<T> {
  eventType: StompType;
  payload: T;
}

export interface ChatSendPayload {
  content: string;
}

export interface MacroPayload {
  questionType: string;
}

export interface MacroTemplatePayload {
  questionType?: string;
  answer?: string;
  sender?: string;
  createdAt?: string;
}

export type { ChatMessageType };
