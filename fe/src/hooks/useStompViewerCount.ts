import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  getStompConnectionState,
  subscribeStream,
  subscribeToStompConnectionState,
  type StompConnectionState,
} from '@/websocket/stompClient';

export function useStompViewerCount() {
  const { id: streamIdParam } = useParams<{ id: string }>();
  const streamId = streamIdParam ?? '';
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionState, setConnectionState] = useState<StompConnectionState>(getStompConnectionState());

  useEffect(() => {
    return subscribeToStompConnectionState(setConnectionState);
  }, []);

  useEffect(() => {
    if (!streamId) {
      return;
    }

    let isDisposed = false;
    let unsubscribe: (() => void) | null = null;

    void subscribeStream<{ eventType?: string; payload?: unknown }>({
      streamId,
      onBroadcast: (response) => {
        if (response.eventType !== 'VIEWER_COUNT') {
          return;
        }

        setViewerCount(typeof response.payload === 'number' ? response.payload : 0);
      },
    })
      .then((cleanup) => {
        if (isDisposed) {
          cleanup();
          return;
        }

        unsubscribe = cleanup;
      })
      .catch((error) => {
        console.error('[viewer-count] failed to subscribe', error);
      });

    return () => {
      isDisposed = true;
      unsubscribe?.();
    };
  }, [streamId]);

  return { viewerCount, connectionState };
}
