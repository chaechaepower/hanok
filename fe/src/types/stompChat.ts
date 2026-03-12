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
  message: string;
}

export interface MacroPayload {
  command: string;
}

export interface MacroTemplatePayload {
  nickname?: string;
  command?: string;
  label?: string;
  message?: string;
}

export type { ChatMessageType };
