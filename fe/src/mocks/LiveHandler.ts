import { http, HttpResponse } from 'msw';
import { BASE_URL } from '@/api/instance';
import type { Live, StartStreamRequest, UpdateStreamRequest, UpdateStreamResponse, DeleteStreamResponse } from '@/types';

// 실제 등록된 방송만 표시 – 초기에는 비어있음
const registeredLives: Live[] = [];
let nextLiveId = 1;

// 삭제된 formatScheduledAt
export const liveHandlers = [
  // GET /v1/lives – 등록된 라이브 방송 목록 조회
  http.get(`${BASE_URL}/v1/lives`, () => {
    return HttpResponse.json({ lives: registeredLives }, { status: 200 });
  }),

  // GET /api/v1/streams/{streamId} - 방송 단건 조회
  http.get(`${BASE_URL}/api/v1/streams/:streamId`, ({ params }) => {
    const streamId = Number(params.streamId);
    const live = registeredLives.find((l) => l.id === streamId);
    if (!live) {
      return HttpResponse.json({ message: 'Stream not found' }, { status: 404 });
    }
    return HttpResponse.json(live, { status: 200 });
  }),

  // POST /api/v1/streams – 라이브 방송 등록 (예약 or 즉시 시작)
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

  // POST /api/v1/streams/{streamId}/start – 방송 즉시 시작 (OpenVidu 세션 생성)
  http.post(`${BASE_URL}/api/v1/streams/:streamId/start`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const body = (await request.json()) as StartStreamRequest;

    // 목록에 없으면 새로 등록
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

  // PATCH /api/v1/streams/{streamId} – 라이브 방송 수정
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

  // DELETE /api/v1/streams/{streamId} – 라이브 방송 삭제
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
