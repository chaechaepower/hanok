import type { ChatMessageType } from './live';

// 백엔드 StompType enum과 1:1 매칭
export type StompType =
  | 'CHAT_MESSAGE'
  | 'CHAT_FILTERED'
  | 'SYSTEM_NOTICE'
  | 'SYSTEM_STREAM_START'
  | 'SYSTEM_STREAM_END'
  | 'MACRO_TEMPLATE';

// 백엔드 StompRequest<T>, StompResponse<T>와 동일 구조
export interface StompRequest<T> {
  eventType: StompType;
  payload: T;
}

export interface StompResponse<T> {
  eventType: StompType;
  payload: T;
}

// ── 클라이언트 → 서버 전송 페이로드 ──

export interface ChatSendPayload {
  message: string;
}

export interface MacroPayload {
  command: string;
}

// 기존 ChatMessageType을 재사용
export type { ChatMessageType };
