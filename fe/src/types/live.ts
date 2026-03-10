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
