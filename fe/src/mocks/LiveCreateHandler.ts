import { http, HttpResponse } from 'msw';
import { BASE_URL } from '@/api/instance';
import Logo from '@/assets/Logo.png';
import type { Live, StartStreamRequest, UpdateStreamRequest, UpdateStreamResponse, DeleteStreamResponse } from '@/types';

const registeredLives: Live[] = [
  {
    id: 1,
    status: '예약',
    thumbnail: Logo,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    title: '명품 가방 경매 시작합니다!',
    category: '가방/패션잡화',
    itemIds: [4, 5],
  },
  {
    id: 2,
    status: '방송중',
    thumbnail: Logo,
    scheduledAt: null,
    title: '나이키 한정판 스니커즈 라이브',
    category: '스니커즈/신발',
    itemIds: [1, 2, 3],
  },
  {
    id: 3,
    status: '종료',
    thumbnail: Logo,
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    title: '롤렉스 서브마리너 단독 1점',
    category: '시계',
    itemIds: [4],
  },
];
let nextLiveId = 4;

export const LiveCreateHandlers = [
  http.get(`${BASE_URL}/v1/lives`, () => {
    return HttpResponse.json({ lives: registeredLives }, { status: 200 });
  }),

  http.get(`${BASE_URL}/api/v1/streams/:streamId`, ({ params }) => {
    const streamId = Number(params.streamId);
    const live = registeredLives.find((l) => l.id === streamId);
    if (!live) {
      return HttpResponse.json({ message: 'Stream not found' }, { status: 404 });
    }
    return HttpResponse.json(live, { status: 200 });
  }),

  http.post(`${BASE_URL}/api/v1/streams`, async ({ request }) => {
    const body = (await request.json()) as StartStreamRequest;

    const newLive: Live = {
      id: nextLiveId++,
      status: body.startType === 'scheduled' ? '예약' : '방송중',
      thumbnail: body.thumbnail || null,
      scheduledAt: body.scheduledAt || null,
      title: body.title,
      category: body.categoryId,
      itemIds: body.itemIds,
      notice: body.notice,
    };

    registeredLives.push(newLive);
    console.log('[Mock] 방송 등록됨:', newLive);

    return HttpResponse.json(
      { streamId: newLive.id, title: newLive.title, status: newLive.status },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/api/v1/streams/:streamId/start`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const body = (await request.json()) as StartStreamRequest;

    if (!registeredLives.find((l) => l.id === streamId)) {
      const newLive: Live = {
        id: streamId,
        status: '방송중',
        thumbnail: body.thumbnail || null,
        scheduledAt: body.scheduledAt || null,
        title: body.title,
        category: body.categoryId,
      };
      registeredLives.push(newLive);
    } else {
      const live = registeredLives.find((l) => l.id === streamId);
      if (live) live.status = '방송중';
    }

    console.log('[Mock] POST /api/v1/streams/:streamId/start → streamId:', streamId, body);

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: '요청이 성공적으로 처리되었습니다.',
        data: {
          status: 'live',
          rtcConfig: {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            sessionId: `openvidu-session-${streamId}`,
          },
          openviduToken: `wss://mock-openvidu-server:4443?sessionId=session-${streamId}&token=mock-token-${Date.now()}`,
        },
      },
      { status: 200 },
    );
  }),

  http.patch(`${BASE_URL}/api/v1/streams/:streamId`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const body = (await request.json()) as UpdateStreamRequest;

    const liveIndex = registeredLives.findIndex((l) => l.id === streamId);
    if (liveIndex !== -1) {
      registeredLives[liveIndex] = {
        ...registeredLives[liveIndex],
        title: body.title,
        category: body.categoryId,
        status: body.startType === 'scheduled' ? '예약' : '방송중',
        thumbnail: body.thumbnail || null,
        scheduledAt: body.scheduledAt || null,
        itemIds: body.itemIds,
        notice: body.notice,
      };
    }

    const response: UpdateStreamResponse = {
      streamId,
      title: body.title,
      status: body.startType === 'scheduled' ? 'scheduled' : 'instant',
    };

    console.log('[Mock] 방송 수정됨:', response);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.delete(`${BASE_URL}/api/v1/streams/:streamId`, ({ params }) => {
    const streamId = Number(params.streamId);

    const liveIndex = registeredLives.findIndex((l) => l.id === streamId);
    if (liveIndex !== -1) {
      registeredLives.splice(liveIndex, 1);
    }

    const response: DeleteStreamResponse = {
      streamId,
      status: 'cancelled',
    };

    console.log('[Mock] 방송 삭제됨 (취소):', response);
    return HttpResponse.json(response, { status: 200 });
  }),
];
