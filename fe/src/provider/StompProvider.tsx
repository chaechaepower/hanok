import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { BASE_URL, getAuthToken } from '@/api/instance';
import { WS_ENDPOINT, RECONNECT_DELAY } from '@/constants/stompChat';
import { StompContext } from './StompContext';
import type { StompConnectionState } from './StompContext';

function buildWsUrl(): string {
  const base = BASE_URL ?? '';
  const wsBase = base
    .replace(/^https:/, 'wss:')
    .replace(/^http:/, 'ws:');
  return `${wsBase}${WS_ENDPOINT}`;
}

interface StompProviderProps {
  streamId: number;
  children: React.ReactNode;
}

export function StompProvider({ streamId, children }: StompProviderProps) {
  const [connectionState, setConnectionState] =
    useState<StompConnectionState>('disconnected');
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const token = getAuthToken();

    const stompClient = new Client({
      brokerURL: buildWsUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: RECONNECT_DELAY,
      onConnect: () => setConnectionState('connected'),
      onDisconnect: () => setConnectionState('disconnected'),
      onStompError: () => setConnectionState('error'),
      onWebSocketClose: () => setConnectionState('disconnected'),
    });

    const timer = setTimeout(() => {
      setClient(stompClient);
      setConnectionState('connecting');
    }, 0);
    stompClient.activate();

    return () => {
      clearTimeout(timer);
      stompClient.deactivate();
      setTimeout(() => {
        setClient(null);
        setConnectionState('disconnected');
      }, 0);
    };
  }, [streamId]);

  return (
    <StompContext.Provider value={{ client, connectionState, streamId }}>
      {children}
    </StompContext.Provider>
  );
}
