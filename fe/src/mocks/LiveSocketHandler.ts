import { ws, type WebSocketData } from 'msw';

import type { AuctionStatisticsPayload, BidSyncPayload, ItemSyncPayload } from '@/types';
import { getStreamSocketConnectUrl } from '@/websocket/socket';

import { getInitialItemSyncPayloadForStream } from './LiveCreateHandler';
import { getSavedMacroAnswer } from './MacroHandler';
import { getCurrentMockUser, mockLoginUsers } from './mockState';

type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

type MockTimerState = {
  durationSeconds: number;
  startedAtMs: number;
  finalPrice: number;
};

type MockAuctionStatisticsState = AuctionStatisticsPayload;
type MockBidSyncState = {
  bidUnit: number;
  highestBidderUserId: number | null;
};
type MockUniqueBidSyncState = {
  bidRange: {
    minPrice: number;
    maxPrice: number;
  };
  participantCount: number;
};
type MockPausedTimerState = {
  remainingSeconds: number;
  finalPrice: number;
};

type BottomUpItem = Extract<ItemSyncPayload['items'][number], { auctionType: 'BOTTOM_UP' }>;
type UniqueTopItem = Extract<ItemSyncPayload['items'][number], { auctionType: 'UNIQUE_TOP' }>;

const AUCTION_DURATION_SECONDS = 10;
const SNIPING_THRESHOLD_SECONDS = 5;
const SNIPING_DURATION_SECONDS = 5;
const HEARTBEAT_INTERVAL_MS = 5_000;
const RECENT_BIDS_LIMIT = 15;
const textEncoder = new TextEncoder();
const CHAT_MACRO_RESPONSES: Record<string, string> = {
  WEARABLE_SIZE: '265mm',
  SIZE: '265mm',
  SHIPPING: '낙찰 후 영업일 기준 2~5일 이내 순차 발송됩니다.',
  MATERIAL: '주요 소재와 디테일은 잠시 후 클로즈업으로 다시 보여드리겠습니다.',
  AUTH: '인증 정보와 검수 기준은 라이브 중에 다시 설명드리겠습니다.',
  CONDITION: '현재 보이는 컨디션 외에 특이사항이 있으면 바로 말씀드리겠습니다.',
  WEIGHT: '무게는 측정 후 채팅으로 다시 안내드리겠습니다.',
  WARRANTY: '보증서 및 구성품 포함 여부를 바로 확인해드리겠습니다.',
  ORIGIN: '확보 경로와 스토리는 설명 타임에 함께 안내드리겠습니다.',
  ARTIST: '작가와 브랜드 배경은 설명 구간에서 정리해서 말씀드리겠습니다.',
};

const liveSocket = ws.link(getStreamSocketConnectUrl());
const clientSubscriptions = new Map<string, Map<string, string>>();
const heartbeatTimers = new Map<string, number>();
const streamTimerStates = new Map<string, MockTimerState>();
const streamAuctionStatisticsStates = new Map<string, MockAuctionStatisticsState>();
const streamBidSyncStates = new Map<string, MockBidSyncState>();
const streamUniqueBidSyncStates = new Map<string, MockUniqueBidSyncState>();
const streamUniqueBidAmountsStates = new Map<string, number[]>();
const streamItemSyncStates = new Map<string, ItemSyncPayload>();
const winnerAnnouncementTimers = new Map<string, number>();
const streamPausedTimerStates = new Map<string, MockPausedTimerState>();

const createTimestamp = (ms: number) => new Date(ms).toISOString();

const isBottomUpItem = (item: ItemSyncPayload['items'][number]): item is BottomUpItem => item.auctionType === 'BOTTOM_UP';

const isUniqueTopItem = (item: ItemSyncPayload['items'][number]): item is UniqueTopItem => item.auctionType === 'UNIQUE_TOP';

const splitFrames = (data: string) =>
  data
    .split('\0')
    .map((frame) => frame.replace(/\r/g, ''))
    .filter((frame) => frame.trim().length > 0);

const parseFrame = (rawFrame: string): StompFrame | null => {
  const separatorIndex = rawFrame.indexOf('\n\n');
  const head = separatorIndex >= 0 ? rawFrame.slice(0, separatorIndex) : rawFrame;
  const body = separatorIndex >= 0 ? rawFrame.slice(separatorIndex + 2) : '';
  const lines = head.split('\n').filter(Boolean);
  const command = lines.shift()?.trim();

  if (!command) {
    return null;
  }

  const headers = lines.reduce<Record<string, string>>((acc, line) => {
    const separator = line.indexOf(':');

    if (separator === -1) {
      return acc;
    }

    const key = line.slice(0, separator);
    const value = line.slice(separator + 1);
    acc[key] = value;
    return acc;
  }, {});

  return {
    command,
    headers,
    body,
  };
};

const serializeFrame = ({ command, headers, body }: StompFrame) => {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
  const frame = [command, ...headerLines, '', body].join('\n');
  return `${frame}\0`;
};

const getClientSubscriptions = (clientId: string) => {
  let subscriptions = clientSubscriptions.get(clientId);

  if (!subscriptions) {
    subscriptions = new Map<string, string>();
    clientSubscriptions.set(clientId, subscriptions);
  }

  return subscriptions;
};

const sendConnectedFrame = (client: { send: (data: WebSocketData) => void }) => {
  client.send(
    serializeFrame({
      command: 'CONNECTED',
      headers: {
        version: '1.2',
        'heart-beat': `${HEARTBEAT_INTERVAL_MS},${HEARTBEAT_INTERVAL_MS}`,
      },
      body: '',
    }),
  );
};

const sendHeartbeat = (client: { send: (data: WebSocketData) => void }) => {
  client.send('\n');
};

const startHeartbeat = (client: { id: string; send: (data: WebSocketData) => void }) => {
  if (heartbeatTimers.has(client.id)) {
    return;
  }

  const heartbeatTimerId = globalThis.setInterval(() => {
    sendHeartbeat(client);
  }, HEARTBEAT_INTERVAL_MS);

  heartbeatTimers.set(client.id, heartbeatTimerId);
};

const createMessageFrame = (subscriptionId: string, destination: string, payload: unknown): StompFrame => {
  const body = JSON.stringify(payload);

  return {
    command: 'MESSAGE',
    headers: {
      subscription: subscriptionId,
      destination,
      'message-id': `${destination}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      'content-type': 'application/json',
      'content-length': String(textEncoder.encode(body).length),
    },
    body,
  };
};

const broadcastToDestination = (destination: string, payload: unknown) => {
  liveSocket.clients.forEach((client) => {
    const subscriptions = clientSubscriptions.get(client.id);

    if (!subscriptions) {
      return;
    }

    subscriptions.forEach((subscribedDestination, subscriptionId) => {
      if (subscribedDestination !== destination) {
        return;
      }

      client.send(serializeFrame(createMessageFrame(subscriptionId, destination, payload)));
    });
  });
};

const createTimerPayload = (state: MockTimerState, nowMs: number) => ({
  durationSeconds: state.durationSeconds,
  serverNow: createTimestamp(nowMs),
  serverStartedAt: createTimestamp(state.startedAtMs),
});

const getItemBidUnit = (item: ItemSyncPayload['items'][number]) => {
  return item.auctionType === 'BOTTOM_UP' ? item.bidUnit : 1000;
};

const createDefaultItemSyncPayload = (): ItemSyncPayload => ({
  items: [
    {
      auctionId: 101,
      itemName: '고려청자 상감운학문 매병',
      description: '고려시대 12세기 상감청자 매병으로, 운학문(구름과 학) 무늬가 정교하게 시문되어 있습니다.',
      images: [
        'https://picsum.photos/seed/101a/400/400',
        'https://picsum.photos/seed/101b/400/400',
        'https://picsum.photos/seed/101c/400/400',
      ],
      auctionStatus: 'READY',
      auctionType: 'UNIQUE_TOP',
      auctionTime: 30,
      finalPrice: null,
      itemCondition: 'BRAND_NEW',
      bidUnit: null,
      startPrice: null,
      minPrice: 250000,
      maxPrice: 1240000,
    },
    {
      auctionId: 102,
      itemName: '청자 투각 칠보문 향로',
      description: '칠보문 투각 기법이 적용된 고려청자 향로입니다.',
      images: [
        'https://picsum.photos/seed/102a/400/400',
        'https://picsum.photos/seed/102b/400/400',
        'https://picsum.photos/seed/102c/400/400',
      ],
      auctionStatus: 'SOLD',
      auctionType: 'BOTTOM_UP',
      auctionTime: 30,
      finalPrice: 195000,
      itemCondition: 'OPEN_BOX',
      bidUnit: 10000,
      startPrice: 130000,
      minPrice: null,
      maxPrice: null,
    },
    {
      auctionId: 103,
      itemName: '백자 달항아리',
      description: '조선 후기 백자 달항아리로 둥근 형태가 특징입니다.',
      images: [
        'https://picsum.photos/seed/103a/400/400',
        'https://picsum.photos/seed/103b/400/400',
        'https://picsum.photos/seed/103c/400/400',
      ],
      auctionStatus: 'SOLD',
      auctionType: 'BOTTOM_UP',
      auctionTime: 60,
      finalPrice: 270000,
      itemCondition: 'REFURBISHED',
      bidUnit: 15000,
      startPrice: 180000,
      minPrice: null,
      maxPrice: null,
    },
    {
      auctionId: 104,
      itemName: '분청사기 철화 어문 장군',
      description: '분청사기에 철화 기법으로 물고기 문양을 그린 장군입니다.',
      images: [
        'https://picsum.photos/seed/104a/400/400',
        'https://picsum.photos/seed/104b/400/400',
        'https://picsum.photos/seed/104c/400/400',
      ],
      auctionStatus: 'SOLD',
      auctionType: 'BOTTOM_UP',
      auctionTime: 30,
      finalPrice: 142500,
      itemCondition: 'USED',
      bidUnit: 5000,
      startPrice: 95000,
      minPrice: null,
      maxPrice: null,
    },
    {
      auctionId: 105,
      itemName: '나전칠기 보석함',
      description: '전통 나전칠기 기법으로 제작된 보석함입니다.',
      images: [
        'https://picsum.photos/seed/105a/400/400',
        'https://picsum.photos/seed/105b/400/400',
        'https://picsum.photos/seed/105c/400/400',
      ],
      auctionStatus: 'SOLD',
      auctionType: 'BOTTOM_UP',
      auctionTime: 60,
      finalPrice: 480000,
      itemCondition: 'BRAND_NEW',
      bidUnit: 20000,
      startPrice: 320000,
      minPrice: null,
      maxPrice: null,
    },
    {
      auctionId: 106,
      itemName: '조선백자 청화 용문 항아리',
      description: '조선시대 청화백자로 용 문양이 힘차게 그려져 있습니다.',
      images: [
        'https://picsum.photos/seed/106a/400/400',
        'https://picsum.photos/seed/106b/400/400',
        'https://picsum.photos/seed/106c/400/400',
      ],
      auctionStatus: 'SOLD',
      auctionType: 'BOTTOM_UP',
      auctionTime: 30,
      finalPrice: 300000,
      itemCondition: 'OPEN_BOX',
      bidUnit: 10000,
      startPrice: 200000,
      minPrice: null,
      maxPrice: null,
    },
    {
      auctionId: 107,
      itemName: '금동 미륵보살 반가사유상',
      description: '삼국시대 금동 반가사유상 재현품입니다.',
      images: [
        'https://picsum.photos/seed/107a/400/400',
        'https://picsum.photos/seed/107b/400/400',
        'https://picsum.photos/seed/107c/400/400',
      ],
      auctionStatus: 'UNSOLD',
      auctionType: 'BOTTOM_UP',
      auctionTime: 60,
      finalPrice: null,
      itemCondition: 'USED',
      bidUnit: 25000,
      startPrice: 500000,
      minPrice: null,
      maxPrice: null,
    },
  ],
});

const getInitialItemSyncPayload = (streamId: string) =>
  getInitialItemSyncPayloadForStream(Number(streamId)) ?? createDefaultItemSyncPayload();

const getStreamIdFromDestination = (destination: string) => destination.split('/').pop() ?? '';

const getRemainingSeconds = (state: MockTimerState, nowMs: number) => {
  const elapsedSeconds = (nowMs - state.startedAtMs) / 1000;
  return state.durationSeconds - elapsedSeconds;
};

const clearWinnerAnnouncement = (streamId: string) => {
  const winnerAnnouncementTimer = winnerAnnouncementTimers.get(streamId);

  if (!winnerAnnouncementTimer) {
    return;
  }

  globalThis.clearTimeout(winnerAnnouncementTimer);
  winnerAnnouncementTimers.delete(streamId);
};

const getActiveLiveItem = (streamId: string) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);
  return itemSyncPayload.items.find((item) => item.auctionStatus === 'LIVE') ?? null;
};

const pauseStreamForReconnect = (streamId: string) => {
  const currentState = streamTimerStates.get(streamId);

  if (currentState) {
    const remainingSeconds = Math.max(
      1,
      Math.ceil((currentState.startedAtMs + currentState.durationSeconds * 1000 - Date.now()) / 1000),
    );

    streamPausedTimerStates.set(streamId, {
      remainingSeconds,
      finalPrice: currentState.finalPrice,
    });
  }

  clearWinnerAnnouncement(streamId);
  streamTimerStates.delete(streamId);

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'STREAM_PAUSED',
    payload: null,
  });
};

const resumeStreamAfterReconnect = (streamId: string) => {
  const pausedState = streamPausedTimerStates.get(streamId);

  if (pausedState) {
    streamTimerStates.set(streamId, {
      durationSeconds: pausedState.remainingSeconds,
      startedAtMs: Date.now(),
      finalPrice: pausedState.finalPrice,
    });

    const activeItem = getActiveLiveItem(streamId);
    if (activeItem?.auctionType === 'UNIQUE_TOP') {
      scheduleUniqueAuctionEnd(streamId);
    } else {
      scheduleWinnerAnnouncement(streamId);
    }

    streamPausedTimerStates.delete(streamId);
  }

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'STREAM_RESUMED',
    payload: null,
  });
};

const failStreamAfterReconnectTimeout = (streamId: string) => {
  clearWinnerAnnouncement(streamId);
  streamTimerStates.delete(streamId);
  streamPausedTimerStates.delete(streamId);

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'STREAM_FAILED',
    payload: null,
  });
};

const activateNextReadyItem = (streamId: string, targetAuctionId?: number) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);

  if (itemSyncPayload.items.some((item) => item.auctionStatus === 'LIVE')) {
    streamItemSyncStates.set(streamId, itemSyncPayload);
    return itemSyncPayload;
  }

  const resolvedAuctionId =
    targetAuctionId ??
    itemSyncPayload.items.find((item) => item.auctionStatus === 'INTRODUCING')?.auctionId ??
    itemSyncPayload.items.find((item) => item.auctionStatus === 'READY')?.auctionId;

  if (typeof resolvedAuctionId !== 'number') {
    streamItemSyncStates.set(streamId, itemSyncPayload);
    return itemSyncPayload;
  }

  const nextPayload: ItemSyncPayload = {
    items: itemSyncPayload.items.map((item) => {
      if (item.auctionId !== resolvedAuctionId) {
        return item;
      }

      if (item.auctionStatus !== 'INTRODUCING' && item.auctionStatus !== 'READY') {
        return item;
      }

      return {
        ...item,
        auctionStatus: 'LIVE',
      };
    }),
  };

  streamItemSyncStates.set(streamId, nextPayload);
  return nextPayload;
};

const introduceAuctionItem = (streamId: string, auctionId: number) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);

  const nextPayload: ItemSyncPayload = {
    items: itemSyncPayload.items.map((item) => {
      if (item.auctionId !== auctionId) {
        return item;
      }

      if (item.auctionStatus !== 'READY') {
        return item;
      }

      return {
        ...item,
        auctionStatus: 'INTRODUCING',
      };
    }),
  };

  streamItemSyncStates.set(streamId, nextPayload);
  return nextPayload;
};

const completeLiveItem = (streamId: string, finalPrice: number) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);
  let completed = false;

  const nextPayload: ItemSyncPayload = {
    items: itemSyncPayload.items.map((item) => {
      if (!completed && item.auctionStatus === 'LIVE') {
        completed = true;
        return {
          ...item,
          auctionStatus: 'SOLD',
          finalPrice,
        };
      }

      return item;
    }),
  };

  streamItemSyncStates.set(streamId, nextPayload);
  return nextPayload;
};

const completeUniqueLiveItem = (streamId: string, isWon: boolean, winnerPrice: number | null) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);
  let completed = false;

  const nextPayload: ItemSyncPayload = {
    items: itemSyncPayload.items.map((item) => {
      if (!completed && item.auctionStatus === 'LIVE') {
        completed = true;
        return {
          ...item,
          auctionStatus: isWon ? 'SOLD' : 'UNSOLD',
          finalPrice: isWon ? winnerPrice : null,
        };
      }

      return item;
    }),
  };

  streamItemSyncStates.set(streamId, nextPayload);
  return nextPayload;
};

const getViewerCountForStream = (streamId: string): number => {
  const destination = `/broadcast/streams/${streamId}`;
  let count = 0;

  clientSubscriptions.forEach((subscriptions) => {
    subscriptions.forEach((subscribedDestination) => {
      if (subscribedDestination === destination) {
        count++;
      }
    });
  });

  return count;
};

const broadcastViewerCount = (streamId: string) => {
  const count = getViewerCountForStream(streamId);

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'VIEWER_COUNT',
    payload: count,
  });
};

const broadcastAuctionStatistics = (streamId: string) => {
  const auctionStatistics = streamAuctionStatisticsStates.get(streamId);

  if (!auctionStatistics) {
    return;
  }

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'AUCTION_STATISTICS',
    payload: auctionStatistics,
  });
};

const createBidSyncPayload = (streamId: string, nowMs: number): BidSyncPayload | null => {
  const timerState = streamTimerStates.get(streamId);
  const bidSyncState = streamBidSyncStates.get(streamId);

  if (!timerState || !bidSyncState) {
    return null;
  }

  return {
    item: {
      bidUnit: bidSyncState.bidUnit,
      currentPrice: timerState.finalPrice,
    },
    timer: createTimerPayload(timerState, nowMs),
    isHighestBidder:
      bidSyncState.highestBidderUserId !== null && bidSyncState.highestBidderUserId === getCurrentMockUser()?.userId,
  };
};

const sendPrivateBidSync = (streamId: string) => {
  broadcastToDestination(`/user/private/streams/${streamId}`, {
    eventType: 'BID_SYNC',
    payload: createBidSyncPayload(streamId, Date.now()),
  });
};

const createUniqueBidSyncPayload = (streamId: string, nowMs: number) => {
  const timerState = streamTimerStates.get(streamId);
  const uniqueBidSyncState = streamUniqueBidSyncStates.get(streamId);

  if (!timerState || !uniqueBidSyncState) {
    return null;
  }

  return {
    bidRange: uniqueBidSyncState.bidRange,
    timer: createTimerPayload(timerState, nowMs),
    participantCount: uniqueBidSyncState.participantCount,
    hasBid: false,
  };
};

const ensureSeededBidAuctionState = (streamId: string) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);
  const activeBidItem = itemSyncPayload?.items.find(
    (item): item is BottomUpItem => isBottomUpItem(item) && item.auctionStatus === 'LIVE',
  );

  if (!activeBidItem) {
    return;
  }

  let initializedTimer = false;

  if (!streamTimerStates.has(streamId)) {
    streamTimerStates.set(streamId, {
      durationSeconds: activeBidItem.auctionTime ?? AUCTION_DURATION_SECONDS,
      startedAtMs: Date.now(),
      finalPrice: activeBidItem.startPrice + getItemBidUnit(activeBidItem),
    });
    initializedTimer = true;
  }

  if (!streamBidSyncStates.has(streamId)) {
    streamBidSyncStates.set(streamId, {
      bidUnit: getItemBidUnit(activeBidItem),
      highestBidderUserId: mockLoginUsers.find((user) => user.userId !== getCurrentMockUser()?.userId)?.userId ?? null,
    });
  }

  if (!streamAuctionStatisticsStates.has(streamId)) {
    const timerState = streamTimerStates.get(streamId);

    if (timerState) {
      streamAuctionStatisticsStates.set(streamId, {
        itemName: activeBidItem.itemName,
        bidCount: 1,
        startPrice: activeBidItem.startPrice,
        currentPrice: timerState.finalPrice,
        recentBids: [
          {
            userId: mockLoginUsers.find((user) => user.userId !== getCurrentMockUser()?.userId)?.userId ?? 9999,
            nickname: mockLoginUsers.find((user) => user.userId !== getCurrentMockUser()?.userId)?.nickname ?? '테스트유저',
            amount: timerState.finalPrice,
            placedAt: createTimestamp(Date.now() - 1000),
          },
        ],
      });
    }
  }

  if (initializedTimer) {
    scheduleWinnerAnnouncement(streamId);
  }
};

const sendPrivateUniqueBidSync = (streamId: string) => {
  broadcastToDestination(`/user/private/streams/${streamId}`, {
    eventType: 'UNIQUE_BID_SYNC',
    payload: createUniqueBidSyncPayload(streamId, Date.now()),
  });
};

const ensureSeededUniqueAuctionState = (streamId: string) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);
  const activeUniqueItem = itemSyncPayload?.items.find(
    (item): item is UniqueTopItem => isUniqueTopItem(item) && item.auctionStatus === 'LIVE',
  );

  if (!activeUniqueItem) {
    return;
  }

  let initializedTimer = false;

  if (!streamTimerStates.has(streamId)) {
    streamTimerStates.set(streamId, {
      durationSeconds: activeUniqueItem.auctionTime ?? AUCTION_DURATION_SECONDS,
      startedAtMs: Date.now(),
      finalPrice: activeUniqueItem.minPrice,
    });
    initializedTimer = true;
  }

  if (!streamUniqueBidSyncStates.has(streamId)) {
    streamUniqueBidSyncStates.set(streamId, {
      bidRange: {
        minPrice: activeUniqueItem.minPrice,
        maxPrice: activeUniqueItem.maxPrice,
      },
      participantCount: 0,
    });
  }

  if (!streamUniqueBidAmountsStates.has(streamId)) {
    streamUniqueBidAmountsStates.set(streamId, []);
  }

  if (initializedTimer) {
    scheduleUniqueAuctionEnd(streamId);
  }
};

const sendPrivateItemSync = (streamId: string) => {
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);

  streamItemSyncStates.set(streamId, itemSyncPayload);
  broadcastToDestination(`/user/private/streams/${streamId}`, {
    eventType: 'ITEM_SYNC',
    payload: itemSyncPayload,
  });
};

const broadcastAuctionComment = (streamId: string, message: string) => {
  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'AUCTION_COMMENT',
    payload: {
      message,
    },
  });
};

const getChatNickname = () => getCurrentMockUser()?.nickname ?? '테스트유저';

const broadcastChatEvent = (streamId: string, payload: unknown) => {
  broadcastToDestination(`/broadcast/streams/${streamId}`, payload);
};

const sendPrivateChatEvent = (streamId: string, payload: unknown) => {
  broadcastToDestination(`/user/private/streams/${streamId}`, payload);
};

const sendItemSyncToClient = (
  client: { send: (data: WebSocketData) => void },
  subscriptionId: string,
  destination: string,
) => {
  const streamId = getStreamIdFromDestination(destination);
  ensureSeededBidAuctionState(streamId);
  ensureSeededUniqueAuctionState(streamId);
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);

  streamItemSyncStates.set(streamId, itemSyncPayload);
  client.send(
    serializeFrame(
      createMessageFrame(subscriptionId, destination, {
        eventType: 'ITEM_SYNC',
        payload: itemSyncPayload,
      }),
    ),
  );
};

const scheduleWinnerAnnouncement = (streamId: string) => {
  clearWinnerAnnouncement(streamId);

  const currentState = streamTimerStates.get(streamId);

  if (!currentState) {
    return;
  }

  const remainingMs = Math.max(0, currentState.startedAtMs + currentState.durationSeconds * 1000 - Date.now());
  const winnerAnnouncementTimer = globalThis.setTimeout(() => {
    const finalState = streamTimerStates.get(streamId);

    if (!finalState) {
      return;
    }

    broadcastToDestination(`/user/private/streams/${streamId}`, {
      eventType: 'BID_WINNER',
      payload: {
        item: {
          itemName: '조선시대 백자 달항아리',
          finalPrice: finalState.finalPrice,
        },
        shipping: {
          recipientName: '김싸피',
          phone: '010-1234-5678',
          addressName: '집',
          postalCode: 123412,
          address: '서울특별시 강남구 테헤란로 212',
          addressDetail: '멀티캠퍼스 10층',
        },
      },
    });

    completeLiveItem(streamId, finalState.finalPrice);
    streamTimerStates.delete(streamId);

    broadcastToDestination(`/broadcast/streams/${streamId}`, {
      eventType: 'AUCTION_END',
      payload: null,
    });

    winnerAnnouncementTimers.delete(streamId);
  }, remainingMs);

  winnerAnnouncementTimers.set(streamId, winnerAnnouncementTimer);
};

const scheduleUniqueAuctionEnd = (streamId: string) => {
  clearWinnerAnnouncement(streamId);
};

const handleUniqueAuctionCalculating = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  const currentState = streamTimerStates.get(streamId);
  const activeItem = getActiveLiveItem(streamId);

  if (!currentState || activeItem?.auctionType !== 'UNIQUE_TOP') {
    return;
  }

  const payload = JSON.parse(body) as {
    payload?: {
      auctionId?: number;
      message?: string;
    };
  };

  if (typeof payload.payload?.auctionId === 'number' && activeItem.auctionId !== payload.payload.auctionId) {
    return;
  }

  const bidAmounts = streamUniqueBidAmountsStates.get(streamId) ?? [];
  const priceCountMap = new Map<number, number>();

  bidAmounts.forEach((amount) => {
    priceCountMap.set(amount, (priceCountMap.get(amount) ?? 0) + 1);
  });

  const uniquePrices = [...priceCountMap.entries()]
    .filter(([, count]) => count === 1)
    .map(([price]) => price)
    .sort((a, b) => b - a);
  const winnerPrice = uniquePrices[0] ?? null;
  const topDuplicates =
    winnerPrice === null
      ? [...priceCountMap.entries()]
          .filter(([, count]) => count > 1)
          .sort((a, b) => b[0] - a[0])
          .slice(0, 3)
          .map(([price, cnt]) => ({ price, cnt }))
      : null;

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'UNIQUE_AUCTION_CALCULATING',
    payload: {
      auctionId: activeItem.auctionId,
      message: payload.payload?.message ?? '집계 중입니다...',
    },
  });

  completeUniqueLiveItem(streamId, winnerPrice !== null, winnerPrice);
  clearWinnerAnnouncement(streamId);
  streamTimerStates.delete(streamId);
  streamUniqueBidSyncStates.delete(streamId);
  streamUniqueBidAmountsStates.delete(streamId);

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'UNIQUE_AUCTION_END',
    payload: {
      isWon: winnerPrice !== null,
      winnerPrice,
      topDuplicates,
    },
  });
};

const handleAuctionStart = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  const payload = JSON.parse(body) as {
    payload?: {
      auctionId?: number;
    };
  };
  const auctionId = payload.payload?.auctionId;
  const nowMs = Date.now();
  const currentUser = getCurrentMockUser();
  const otherBidder =
    mockLoginUsers.find((user) => user.userId !== currentUser?.userId && !user.isSeller) ??
    mockLoginUsers.find((user) => user.userId !== currentUser?.userId) ??
    null;
  const itemName = '나이키 에어맥스 95';
  const startPrice = 50000;
  const bidUnit = 1000;
  const currentUserBidAmount = startPrice + bidUnit;
  const topBidAmount = startPrice + bidUnit * 2;
  const bidAmount = topBidAmount;
  const state: MockTimerState = {
    durationSeconds: AUCTION_DURATION_SECONDS,
    startedAtMs: nowMs,
    finalPrice: topBidAmount,
  };
  const auctionStatisticsState: MockAuctionStatisticsState = {
    itemName,
    bidCount: currentUser ? 2 : 1,
    startPrice,
    currentPrice: topBidAmount,
    recentBids: [
      {
        userId: otherBidder?.userId ?? 9999,
        nickname: otherBidder?.nickname ?? '사용자',
        amount: topBidAmount,
        placedAt: createTimestamp(nowMs),
      },
      ...(currentUser
        ? [
            {
              userId: currentUser.userId,
              nickname: currentUser.nickname,
              amount: currentUserBidAmount,
              placedAt: createTimestamp(nowMs - 2_000),
            },
          ]
        : []),
    ],
  };

  streamTimerStates.set(streamId, state);
  streamAuctionStatisticsStates.set(streamId, auctionStatisticsState);
  streamBidSyncStates.set(streamId, { bidUnit, highestBidderUserId: otherBidder?.userId ?? null });
  activateNextReadyItem(streamId, auctionId);
  scheduleWinnerAnnouncement(streamId);

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'AUCTION_START',
    payload: {
      item: {
        name: itemName,
        image: 'https://cdn.example.com/items/shoes.jpg',
        condition: 'GOOD',
        bidUnit,
        startPrice,
      },
      timer: createTimerPayload(state, nowMs),
    },
  });
  broadcastAuctionComment(streamId, '경매가 시작되었습니다.');

  if (topBidAmount > 0) {
    broadcastAuctionComment(streamId, `현재 최고 입찰가 ${bidAmount.toLocaleString('ko-KR')}원입니다!`);
  }

  broadcastAuctionStatistics(streamId);
};

const handleUniqueAuctionStart = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  const payload = JSON.parse(body) as {
    payload?: {
      auctionId?: number;
    };
  };
  const auctionId = payload.payload?.auctionId;
  const nowMs = Date.now();
  const itemSyncPayload = streamItemSyncStates.get(streamId) ?? getInitialItemSyncPayload(streamId);
  const targetItem =
    itemSyncPayload.items.find((item) => item.auctionId === auctionId) ??
    itemSyncPayload.items.find((item) => item.auctionStatus === 'INTRODUCING') ??
    itemSyncPayload.items.find((item) => item.auctionStatus === 'READY');
  const minPrice = targetItem?.minPrice ?? 1000;
  const maxPrice = targetItem?.maxPrice ?? minPrice;
  const state: MockTimerState = {
    durationSeconds: AUCTION_DURATION_SECONDS,
    startedAtMs: nowMs,
    finalPrice: minPrice,
  };

  streamTimerStates.set(streamId, state);
  streamUniqueBidSyncStates.set(streamId, {
    bidRange: {
      minPrice,
      maxPrice,
    },
    participantCount: 0,
  });
  streamUniqueBidAmountsStates.set(streamId, []);
  activateNextReadyItem(streamId, auctionId);
  scheduleUniqueAuctionEnd(streamId);

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'UNIQUE_AUCTION_START',
    payload: {
      bidRange: {
        minPrice,
        maxPrice,
      },
      timer: createTimerPayload(state, nowMs),
    },
  });
  broadcastAuctionComment(streamId, '경매가 시작되었습니다.');
};

const handleUniqueBidPlace = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  ensureSeededUniqueAuctionState(streamId);
  const payload = JSON.parse(body) as {
    payload?: {
      amount?: number;
    };
  };
  const amount = payload.payload?.amount ?? 0;
  const currentAmounts = streamUniqueBidAmountsStates.get(streamId) ?? [];
  const nextAmounts = amount > 0 ? [...currentAmounts, amount] : currentAmounts;

  streamUniqueBidAmountsStates.set(streamId, nextAmounts);

  const currentState = streamUniqueBidSyncStates.get(streamId);

  if (currentState) {
    streamUniqueBidSyncStates.set(streamId, {
      ...currentState,
      participantCount: nextAmounts.length,
    });
  }

  broadcastToDestination(`/user/private/streams/${streamId}`, {
    eventType: 'UNIQUE_BID_ACK',
    payload: {
      amount,
    },
  });

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'UNIQUE_AUCTION_STATS',
    payload: {
      participantCount: nextAmounts.length,
    },
  });
};

const handleBidPlace = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  const payload = JSON.parse(body) as {
    payload?: {
      amount?: number;
    };
  };
  const nowMs = Date.now();
  const bidAmount = payload.payload?.amount ?? 0;
  let currentState = streamTimerStates.get(streamId);
  let snipingTimer: ReturnType<typeof createTimerPayload> | null = null;

  if (currentState) {
    currentState = {
      ...currentState,
      finalPrice: bidAmount || currentState.finalPrice,
    };

    streamTimerStates.set(streamId, currentState);
  }

  const currentStatisticsState = streamAuctionStatisticsStates.get(streamId);
  const currentUserId = getCurrentMockUser()?.userId ?? null;

  if (bidAmount > 0) {
    const currentBidSyncState = streamBidSyncStates.get(streamId);

    if (currentBidSyncState) {
      streamBidSyncStates.set(streamId, {
        ...currentBidSyncState,
        highestBidderUserId: currentUserId,
      });
    }
  }

  if (currentStatisticsState) {
    streamAuctionStatisticsStates.set(streamId, {
      ...currentStatisticsState,
      bidCount: currentStatisticsState.bidCount + 1,
      currentPrice: bidAmount || currentStatisticsState.currentPrice,
      recentBids: [
        {
          userId: currentUserId ?? 0,
          nickname: '홍길동',
          amount: bidAmount,
          placedAt: createTimestamp(nowMs),
        },
        ...currentStatisticsState.recentBids,
      ].slice(0, RECENT_BIDS_LIMIT),
    });
  }

  if (currentState && getRemainingSeconds(currentState, nowMs) <= SNIPING_THRESHOLD_SECONDS) {
    const nextState: MockTimerState = {
      durationSeconds: SNIPING_DURATION_SECONDS,
      startedAtMs: nowMs,
      finalPrice: currentState.finalPrice,
    };

    streamTimerStates.set(streamId, nextState);
    snipingTimer = createTimerPayload(nextState, nowMs);
    scheduleWinnerAnnouncement(streamId);
  }

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'BID_PLACED',
    payload: {
      bidInfo: {
        nickname: '홍길동',
        amount: bidAmount,
        placedAt: createTimestamp(nowMs),
      },
      snipingTimer,
    },
  });

  if (bidAmount > 0) {
    broadcastAuctionComment(streamId, `현재 최고 입찰가 ${bidAmount.toLocaleString('ko-KR')}원입니다!`);
  }

  broadcastAuctionStatistics(streamId);
};

const handleBidSync = (destination: string) => {
  const streamId = getStreamIdFromDestination(destination);
  ensureSeededBidAuctionState(streamId);
  sendPrivateBidSync(streamId);
};

const handleUniqueBidSync = (destination: string) => {
  const streamId = getStreamIdFromDestination(destination);
  ensureSeededUniqueAuctionState(streamId);
  sendPrivateUniqueBidSync(streamId);
};

const handleItemSync = (destination: string) => {
  const streamId = getStreamIdFromDestination(destination);
  ensureSeededBidAuctionState(streamId);
  ensureSeededUniqueAuctionState(streamId);
  sendPrivateItemSync(streamId);
};

const handleAuctionItemIntroduce = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  const payload = JSON.parse(body) as {
    payload?: {
      auctionId?: number;
    };
  };
  const auctionId = payload.payload?.auctionId;

  if (typeof auctionId === 'number') {
    introduceAuctionItem(streamId, auctionId);
  }

  broadcastToDestination(`/broadcast/streams/${streamId}`, {
    eventType: 'ITEM_INTRODUCE',
    payload: null,
  });
};

const handleChatMessage = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  const payload = JSON.parse(body) as {
    payload?: {
      content?: string;
      message?: string;
    };
  };
  const message = (payload.payload?.content ?? payload.payload?.message)?.trim();

  if (!message) {
    return;
  }

  if (message === '/pause') {
    pauseStreamForReconnect(streamId);
    return;
  }

  if (message === '/resume') {
    resumeStreamAfterReconnect(streamId);
    return;
  }

  if (message === '/fail') {
    failStreamAfterReconnectTimeout(streamId);
    return;
  }

  broadcastChatEvent(streamId, {
    eventType: 'CHAT_MESSAGE',
    payload: {
      nickname: getChatNickname(),
      content: message,
    },
  });
};

const handleMacroTemplate = (destination: string, body: string) => {
  const streamId = getStreamIdFromDestination(destination);
  const payload = JSON.parse(body) as {
    payload?: {
      questionType?: string;
    };
  };
  const questionType = payload.payload?.questionType?.trim();

  if (!questionType) {
    return;
  }

  const responseMessage =
    getSavedMacroAnswer(Number(streamId), questionType) ||
    CHAT_MACRO_RESPONSES[questionType] ||
    '해당 질문은 잠시 후 라이브에서 안내드리겠습니다.';

  globalThis.setTimeout(() => {
    sendPrivateChatEvent(streamId, {
      eventType: 'MACRO_TEMPLATE',
      payload: {
        questionType,
        answer: responseMessage,
        sender: 'seller',
        createdAt: new Date().toISOString(),
      },
    });
  }, 250);
};

const handleSendFrame = (frame: StompFrame) => {
  if (frame.headers.destination?.startsWith('/app/streams/')) {
    const body = JSON.parse(frame.body) as { eventType?: string };

    if (body.eventType === 'AUCTION_START') {
      handleAuctionStart(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'UNIQUE_AUCTION_START') {
      handleUniqueAuctionStart(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'BID_PLACED') {
      handleBidPlace(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'UNIQUE_BID_PLACE') {
      handleUniqueBidPlace(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'BID_SYNC') {
      handleBidSync(frame.headers.destination);
    }

    if (body.eventType === 'UNIQUE_BID_SYNC') {
      handleUniqueBidSync(frame.headers.destination);
    }

    if (body.eventType === 'UNIQUE_AUCTION_CALCULATING') {
      handleUniqueAuctionCalculating(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'ITEM_SYNC') {
      handleItemSync(frame.headers.destination);
    }

    if (body.eventType === 'ITEM_INTRODUCE') {
      handleAuctionItemIntroduce(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'CHAT_MESSAGE') {
      handleChatMessage(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'MACRO_TEMPLATE') {
      handleMacroTemplate(frame.headers.destination, frame.body);
    }

    if (body.eventType === 'STREAM_PAUSED') {
      pauseStreamForReconnect(getStreamIdFromDestination(frame.headers.destination));
    }

    if (body.eventType === 'STREAM_RESUMED') {
      resumeStreamAfterReconnect(getStreamIdFromDestination(frame.headers.destination));
    }

    if (body.eventType === 'STREAM_FAILED') {
      failStreamAfterReconnectTimeout(getStreamIdFromDestination(frame.headers.destination));
    }
  }
};

export const liveSocketHandler = liveSocket.addEventListener('connection', ({ client }) => {
  getClientSubscriptions(client.id);

  client.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') {
      return;
    }

    splitFrames(event.data).forEach((rawFrame) => {
      const frame = parseFrame(rawFrame);

      if (!frame) {
        return;
      }

      if (frame.command === 'CONNECT' || frame.command === 'STOMP') {
        sendConnectedFrame(client);
        startHeartbeat(client);
        return;
      }

      if (frame.command === 'SUBSCRIBE') {
        const subscriptionId = frame.headers.id;
        const destination = frame.headers.destination;

        if (subscriptionId && destination) {
          getClientSubscriptions(client.id).set(subscriptionId, destination);

          if (destination.startsWith('/broadcast/streams/')) {
            sendItemSyncToClient(client, subscriptionId, destination);
            broadcastViewerCount(getStreamIdFromDestination(destination));
          }
        }
        return;
      }

      if (frame.command === 'UNSUBSCRIBE') {
        const subscriptionId = frame.headers.id;

        if (subscriptionId) {
          const subscriptions = getClientSubscriptions(client.id);
          const destination = subscriptions.get(subscriptionId);

          subscriptions.delete(subscriptionId);

          if (destination?.startsWith('/broadcast/streams/')) {
            broadcastViewerCount(getStreamIdFromDestination(destination));
          }
        }
        return;
      }

      if (frame.command === 'SEND') {
        handleSendFrame(frame);
      }
    });
  });

  client.addEventListener('close', () => {
    const heartbeatTimer = heartbeatTimers.get(client.id);

    if (heartbeatTimer) {
      globalThis.clearInterval(heartbeatTimer);
      heartbeatTimers.delete(client.id);
    }

    const subscriptions = clientSubscriptions.get(client.id);
    const affectedStreamIds = new Set<string>();

    if (subscriptions) {
      subscriptions.forEach((destination) => {
        if (destination.startsWith('/broadcast/streams/')) {
          affectedStreamIds.add(getStreamIdFromDestination(destination));
        }
      });
    }

    clientSubscriptions.delete(client.id);

    affectedStreamIds.forEach((sid) => {
      broadcastViewerCount(sid);
    });
  });
});
