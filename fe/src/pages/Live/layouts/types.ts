import type { RefObject } from 'react';
import type {
  AuctionStatisticsPayload,
  BidSyncPayload,
  ItemSyncPayload,
  LiveAuctionType,
  SyncedAuctionTimer,
  StreamEnterResponse,
  UniqueBidSyncPayload,
  ItemSyncItem,
} from '@/types';
import type { WinnerInfoState, UniqueAuctionResultState } from '@/hooks/useLiveStream';

export interface StreamProps {
  streamTitle: string;
  isSeller: boolean;
  isStreamLive: boolean;
  streamState: string;
  liveStartedAt: string | null;
  activeStreamEnter: StreamEnterResponse | null;
}

export interface AuctionProps {
  selectedAuctionId: number | null;
  visibleSelectedAuctionId: number | null;
  setSelectedAuctionId: (id: number | null) => void;
  liveAuctionItem: ItemSyncItem | null;
  introducingAuctionItem: ItemSyncItem | null;
  activeBidAuctionId: number | null;
  activeAuctionType: LiveAuctionType | null;
  isAuctionInProgress: boolean;
  hasPendingAuctionItems: boolean;
  itemSync: ItemSyncPayload | null;
  bidSync: BidSyncPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  auctionStatistics: AuctionStatisticsPayload | null;
  auctionComment: { id: number; message: string } | null;
  timer: SyncedAuctionTimer | null;
  readyItems: ItemSyncItem[];
  introduceAuctionId: number | null;
  startAuctionId: number | null;
  startAuctionType: LiveAuctionType | null;
  canIntroduceAuction: boolean;
  canStartAuction: boolean;
  handleAuctionTimerExpire: () => void;
}

export interface LiveKitProps {
  livekitState: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  bgVideoRef: RefObject<HTMLVideoElement | null>;
  viewerCount: number;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleRemoteAudio: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
  isRemoteAudioMuted: boolean;
}

export interface ChatProps {
  isChatOpen: boolean;
  handleToggleChat: () => void;
}

export interface ModalProps {
  showSellerStartModal: boolean;
  hasStartedThisStream: boolean;
  postStartStreamIsPending: boolean;
  handleSellerStartModalConfirm: () => void;
  showStreamEndModal: boolean;
  postEndStreamIsPending: boolean;
  setShowStreamEndModal: (open: boolean) => void;
  handleStreamEndConfirm: () => void;
  handleOpenStreamEndModal: () => void;
  winnerInfo: WinnerInfoState | null;
  uniqueAuctionResult: UniqueAuctionResultState | null;
  handleWinConfirm: () => Promise<void>;
  clearWinnerInfo: () => void;
  handleUniqueAuctionResultClose: () => void;
  markStreamEnded: () => void;
}

export interface LiveLayoutProps {
  stream: StreamProps;
  auction: AuctionProps;
  livekit: LiveKitProps;
  chat: ChatProps;
  modal: ModalProps;
  navigate: (path: string) => void;
}
