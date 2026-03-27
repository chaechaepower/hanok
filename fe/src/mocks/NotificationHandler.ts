import { http, HttpResponse } from 'msw';

let mockNotifications = [
  {
    id: 1730000000000,
    type: 'STREAM_START',
    title: '방송 시작',
    body: '홍길동님이 방송을 시작했습니다.',
    isRead: false,
    createdAt: '2025-03-27T12:00:00',
    routingPayload: {
      streamId: 1,
    },
  },
  {
    id: 1730000000001,
    type: 'NOTICE_CREATE',
    title: '공지사항 등록',
    body: '빈티지창고님이 공지사항을 게시했습니다.',
    isRead: false,
    createdAt: '2025-03-27T11:40:00',
    routingPayload: {
      sellerId: 200,
      noticeId: 5,
    },
  },
  {
    id: 1730000000002,
    type: 'ESCROW_STARTED_FOR_BUYER',
    title: '거래 시작',
    body: '오프화이트 스니커즈를 낙찰하여 거래가 시작되었습니다.',
    isRead: false,
    createdAt: '2025-03-27T11:15:00',
    routingPayload: {
      escrowId: 101,
    },
  },
  {
    id: 1730000000003,
    type: 'ESCROW_SHIPPED_FOR_BUYER',
    title: '상품 발송',
    body: '빈티지창고님이 롤렉스 데이저스트를 발송했습니다.',
    isRead: false,
    createdAt: '2025-03-27T10:45:00',
    routingPayload: {
      escrowId: 102,
    },
  },
  {
    id: 1730000000004,
    type: 'ESCROW_STARTED_FOR_SELLER',
    title: '새로운 주문',
    body: '김구매님이 한정판 피규어를 낙찰했습니다. 배송을 준비해주세요.',
    isRead: false,
    createdAt: '2025-03-27T10:20:00',
    routingPayload: {
      escrowId: 201,
    },
  },
  {
    id: 1730000000005,
    type: 'ESCROW_COMPLETED_FOR_SELELR',
    title: '거래 완료',
    body: '빈티지 백 거래가 안전하게 완료되었습니다.',
    isRead: true,
    createdAt: '2025-03-27T09:10:00',
    routingPayload: {
      escrowId: 202,
    },
  },
];

export const notificationHandlers = [
  http.get('*/v1/sse/subscribe', () => {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('event: CONNECTED\ndata: {}\n\n'));
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),

  http.get('*/v1/notifications', ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.max(1, Number(url.searchParams.get('limit') ?? '20'));
    const cursor = url.searchParams.get('cursor');
    const startIndex = cursor
      ? Math.max(
          0,
          mockNotifications.findIndex((notification) => String(notification.id) === cursor) + 1,
        )
      : 0;
    const items = mockNotifications.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < mockNotifications.length;

    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'OK',
      data: {
        items,
        unreadCount: mockNotifications.filter((notification) => !notification.isRead).length,
        hasNext,
        nextCursor: hasNext ? String(items.at(-1)?.id ?? '') : null,
      },
    });
  }),

  http.get('*/v1/notifications/unread-count', () => {
    return HttpResponse.json(mockNotifications.filter((notification) => !notification.isRead).length);
  }),

  http.patch('*/v1/notifications/:notificationId/read', ({ params }) => {
    const notificationId = Number(params.notificationId);

    mockNotifications = mockNotifications.map((notification) =>
      notification.id === notificationId ? { ...notification, isRead: true } : notification,
    );

    return HttpResponse.json({ status: 'SUCCESS', message: 'OK', data: null });
  }),

  http.patch('*/v1/notifications/read-all', () => {
    mockNotifications = mockNotifications.map((notification) => ({ ...notification, isRead: true }));

    return HttpResponse.json({ status: 'SUCCESS', message: 'OK', data: null });
  }),
];
