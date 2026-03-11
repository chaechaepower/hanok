import { http, HttpResponse } from 'msw';
import { BASE_URL } from '@/api/instance';
import Logo from '@/assets/Logo.png';
import type { Live, StartStreamRequest, UpdateStreamRequest, UpdateStreamResponse, DeleteStreamResponse } from '@/types';

const registeredLives: Live[] = [
  {
    streamId: 1,
    title: '명품 가방 경매 시작합니다!',
    category: 'BAGS_FASHION_ACCESSORIES',
    thumbnail: Logo,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    startType: 'SCHEDULED',
    notice: '',
    isLive: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    streamId: 2,
    title: '나이키 한정판 스니커즈 라이브',
    category: 'SNEAKERS_SHOES',
    thumbnail: Logo,
    scheduledAt: null,
    startType: 'IMMEDIATE',
    notice: '',
    isLive: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    streamId: 3,
    title: '롤렉스 서브마리너 단독 1점',
    category: 'WATCHES',
    thumbnail: Logo,
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    startType: 'SCHEDULED',
    notice: '',
    isLive: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];
let nextLiveId = 4;

export const LiveCreateHandlers = [
  http.get(`${BASE_URL}/v1/streams/scheduled`, ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(0, Number(url.searchParams.get('page') ?? '0'));
    const size = Math.max(1, Number(url.searchParams.get('size') ?? '8'));

    const scheduled = registeredLives
      .filter((l) => l.isLive || l.startType === 'SCHEDULED')
      .map((l) => ({
        streamId: l.streamId,
        title: l.title,
        category: l.category,
        thumbnail: l.thumbnail,
        scheduledAt: l.scheduledAt,
        state: l.isLive ? ('LIVE' as const) : ('SCHEDULED' as const),
      }));

    const start = page * size;
    const end = start + size;
    const paged = scheduled.slice(start, end);

    return HttpResponse.json({ streams: paged, hasNext: end < scheduled.length });
  }),

  http.get(`${BASE_URL}/v1/streams/:streamId`, ({ params }) => {
    const streamId = Number(params.streamId);
    const live = registeredLives.find((l) => l.streamId === streamId);
    if (!live) {
      return HttpResponse.json({ message: 'Stream not found' }, { status: 404 });
    }
    return HttpResponse.json(live, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/streams`, async ({ request }) => {
    let body: StartStreamRequest;
    const contentType = request.headers.get('content-type') || '';

    let thumbnailUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const requestPart = formData.get('request');
      const text = requestPart instanceof Blob ? await requestPart.text() : (requestPart as string);
      body = JSON.parse(text) as StartStreamRequest;

      const thumbnailFile = formData.get('thumbnail');
      if (thumbnailFile instanceof Blob) {
        const buffer = await thumbnailFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        thumbnailUrl = `data:${thumbnailFile.type || 'image/png'};base64,${btoa(binary)}`;
      }
    } else {
      body = (await request.json()) as StartStreamRequest;
    }

    const newId = nextLiveId++;
    const newLive: Live = {
      streamId: newId,
      title: body.title,
      category: body.category,
      thumbnail: thumbnailUrl,
      scheduledAt: body.scheduledAt || null,
      startType: body.startType,
      notice: body.notice,
      isLive: body.startType === 'IMMEDIATE',
      createdAt: new Date().toISOString(),
    };

    registeredLives.push(newLive);
    console.log('[Mock] 방송 등록됨:', newLive);

    return HttpResponse.json(
      {
        streamId: newId,
        title: newLive.title,
        status: body.startType === 'SCHEDULED' ? 'SCHEDULED' : 'LIVE',
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/streams/:streamId/start`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const body = (await request.json()) as StartStreamRequest;

    if (!registeredLives.find((l) => l.streamId === streamId)) {
      const newLive: Live = {
        streamId,
        title: body.title,
        category: body.category,
        thumbnail: null,
        scheduledAt: body.scheduledAt || null,
        startType: 'IMMEDIATE',
        notice: body.notice,
        isLive: true,
        createdAt: new Date().toISOString(),
      };
      registeredLives.push(newLive);
    } else {
      const live = registeredLives.find((l) => l.streamId === streamId);
      if (live) live.isLive = true;
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

  http.patch(`${BASE_URL}/v1/streams/:streamId`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const body = (await request.json()) as UpdateStreamRequest;

    const liveIndex = registeredLives.findIndex((l) => l.streamId === streamId);
    if (liveIndex !== -1) {
      registeredLives[liveIndex] = {
        ...registeredLives[liveIndex],
        title: body.title,
        category: body.category,
        startType: body.startType,
        scheduledAt: body.scheduledAt || null,
        notice: body.notice,
      };
    }

    const response: UpdateStreamResponse = {
      streamId,
      title: body.title,
      status: body.startType === 'SCHEDULED' ? 'SCHEDULED' : 'LIVE',
    };

    console.log('[Mock] 방송 수정됨:', response);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.delete(`${BASE_URL}/v1/streams/:streamId`, ({ params }) => {
    const streamId = Number(params.streamId);

    const liveIndex = registeredLives.findIndex((l) => l.streamId === streamId);
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
