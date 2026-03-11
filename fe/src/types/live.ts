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

export type UpdateStreamRequest = {
  title: string;
  categoryId: string;
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

export type DeleteStreamResponse = {
  streamId: number;
  status: 'cancelled';
};
