import type { AuctionDuration, ChatMessageType } from './live';

// 백엔드 StompType enum과 1:1 매칭
export type StompType =
  | 'CHAT_MESSAGE'
  | 'CHAT_FILTERED'
  | 'SYSTEM_NOTICE'
  | 'SYSTEM_STREAM_START'
  | 'SYSTEM_STREAM_END'
  | 'BID_PLACED'
  | 'BID_WINNER'
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

export interface BidPlacePayload {
  amount: number;
}

export interface AuctionStartPayload {
  itemId: number;
  duration: AuctionDuration;
  startPrice: number;
  bidUnit: number;
}

export interface AuctionDescribePayload {
  itemId: number;
}

// ── 서버 → 클라이언트 수신 페이로드 ──

export interface BidEntry {
  bidId: number;
  nickname: string;
  amount: number;
  timestamp: string;
  isTop: boolean;
}

export interface TopBidder {
  rank: number;
  nickname: string;
  amount: number;
}

export interface AuctionState {
  itemId: number;
  itemName: string;
  startPrice: number;
  bidUnit: number;
  duration: AuctionDuration;
  endsAt: string;
}

export interface AuctionResult {
  itemId: number;
  winnerNickname: string;
  finalPrice: number;
}

// 기존 ChatMessageType을 재사용
export type { ChatMessageType, AuctionDuration };
