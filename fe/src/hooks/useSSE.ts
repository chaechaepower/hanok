import { useEffect, useRef } from 'react';

import { BASE_URL } from '@/api/instance';
import { refreshToken } from '@/api/hooks/usePostRefreshToken';
import type { Notification } from '@/types';

interface UseSSEOptions {
  onNotification: (notification: Notification) => void;
  enabled: boolean;
}

export function useSSE({ onNotification, enabled }: UseSSEOptions) {
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    if (!enabled) return;

    let backoff = 1000;
    let cancelled = false;
    let currentController: AbortController | null = null;

    const connect = async () => {
      if (cancelled) return;

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      currentController = new AbortController();

      try {
        const response = await fetch(`${BASE_URL}/v1/sse/subscribe`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: currentController.signal,
        });

        if (response.status === 401) {
          try {
            await refreshToken();
            if (!cancelled) setTimeout(connect, 500);
          } catch {
            // refresh failed, stop reconnecting
          }
          return;
        }

        if (!response.ok || !response.body) return;

        backoff = 1000;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const event of events) {
            const lines = event.split('\n');
            let eventType = '';
            let data = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                data = line.slice(5).trim();
              }
            }

            if (eventType === 'NOTIFICATION' && data) {
              try {
                const notification: Notification = JSON.parse(data);
                onNotificationRef.current(notification);
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }

      // Reconnect with exponential backoff
      if (!cancelled) {
        setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 30000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      currentController?.abort();
    };
  }, [enabled]);
}
