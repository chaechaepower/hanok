export type LiveSeller = {
  sellerId: number;
  nickname: string;
  profileImageUri: string | null;
};

export type LiveCardData = {
  streamId: number;
  title: string;
  category: string;
  thumbnailUri: string | null;
  isLive: boolean;
  viewerCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  seller: LiveSeller;
};

export type AuctionDuration = 10 | 30 | 60;

export type TimerPhase = 'normal' | 'urgent' | 'ended';

export type StreamState = 'live' | 'disconnected' | 'ended';

export type ChatMessageType =
  | { id: number; type: 'chat'; nickname: string; message: string }
  | { id: number; type: 'macro_request'; nickname: string; command: string }
  | { id: number; type: 'macro_response'; label: string; message: string }
  | { id: number; type: 'system'; message: string };

// ─── 라이브 방송 관리 (LiveCreate) ──────────────────────────────────────────
export type LiveStatus = '예약' | '방송중' | '종료' | null;

export type Live = {
  id: number;
  status: LiveStatus;
  thumbnail: string | null;
  scheduledAt: string | null;
  title: string;
  category: string;
  itemIds?: number[];
  notice?: string;
};

export type LiveListResponse = {
  lives: Live[];
};

// ─── POST /api/v1/streams/{streamId}/start ───────────────────────────────────
export type StartStreamRequest = {
  title: string;
  categoryId: string;
  thumbnail: string;
  itemIds: number[];
  startType: 'scheduled' | 'immediate';
  notice?: string;
  scheduledAt?: string;
};

export type RtcConfig = {
  iceServers: unknown[];
  sessionId: string;
};

export type StartStreamData = {
  status: 'live';
  rtcConfig: RtcConfig;
  openviduToken: string;
};

export type StartStreamResponse = {
  status: 'SUCCESS' | 'FAIL';
  message: string;
  data: StartStreamData;
};

// ─── PATCH /api/v1/streams/{streamId} ───────────────────────────────────────
export type UpdateStreamRequest = {
  title: string;
  categoryId: string; // 참고: 명세서는 2 (number)지만 기존 로직상 string으로 맞춤
  itemIds: number[];
  startType: 'scheduled' | 'immediate';
  thumbnail?: string;
  notice?: string;
  scheduledAt?: string;
};

export type UpdateStreamResponse = {
  streamId: number;
  title: string;
  status: string;
};

// ─── DELETE /api/v1/streams/{streamId} ──────────────────────────────────────
export type DeleteStreamResponse = {
  streamId: number;
  status: 'cancelled';
};
