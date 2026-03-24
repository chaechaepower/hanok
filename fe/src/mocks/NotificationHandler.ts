import { http, HttpResponse } from 'msw';

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

  http.get('*/v1/notifications', () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'OK',
      data: {
        items: [],
        unreadCount: 0,
        hasNext: false,
        nextCursor: null,
      },
    });
  }),

  http.get('*/v1/notifications/unread-count', () => {
    return HttpResponse.json(0);
  }),
];
