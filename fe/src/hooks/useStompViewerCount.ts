import { useEffect, useRef, useState } from 'react';
import { useStomp } from './useStomp';
import { DESTINATION_PREFIX } from '@/constants/stomp';
import type { StompResponse } from '@/types/stomp';

export function useStompViewerCount() {
  const { client, connectionState, streamId } = useStomp();
  const [viewerCount, setViewerCount] = useState(0);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (connectionState !== 'connected' || !client) return;

    const destination = `${DESTINATION_PREFIX.BROADCAST}/stream/${streamId}/viewers`;

    subRef.current = client.subscribe(destination, (frame) => {
      const res: StompResponse<number> = JSON.parse(frame.body);
      setViewerCount(res.payload);
    });

    return () => {
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, [client, connectionState, streamId]);

  return { viewerCount };
}
