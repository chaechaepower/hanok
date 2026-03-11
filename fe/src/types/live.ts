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

export type Live = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  scheduledAt: string | null;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  notice?: string;
  isLive: boolean;
  createdAt: string;
};

export type StartStreamRequest = {
  title: string;
  category: string;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  scheduledAt?: string;
  notice?: string;
  itemIds: number[];
};

export type PostStreamResponse = {
  streamId: number;
  title: string;
  status: string;
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
  category: string;
  startType: 'SCHEDULED' | 'IMMEDIATE';
  scheduledAt?: string;
  notice?: string;
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

export type ScheduledStream = {
  streamId: number;
  title: string;
  category: string;
  thumbnail: string | null;
  scheduledAt: string | null;
  state: 'LIVE' | 'SCHEDULED';
};

export type ScheduledStreamsResponse = {
  streams: ScheduledStream[];
  hasNext: boolean;
};
