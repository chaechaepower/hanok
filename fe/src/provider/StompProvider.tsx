import { createContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { BASE_URL, getAuthToken } from '@/api/instance';
import { WS_ENDPOINT, RECONNECT_DELAY } from '@/constants/stompChat';

export type StompConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface StompContextValue {
  client: Client | null;
  connectionState: StompConnectionState;
  streamId: number;
}

export const StompContext = createContext<StompContextValue | null>(null);

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
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = getAuthToken();

    const client = new Client({
      brokerURL: buildWsUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: RECONNECT_DELAY,
      onConnect: () => setConnectionState('connected'),
      onDisconnect: () => setConnectionState('disconnected'),
      onStompError: () => setConnectionState('error'),
      onWebSocketClose: () => setConnectionState('disconnected'),
    });

    clientRef.current = client;
    setConnectionState('connecting');
    client.activate();

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnectionState('disconnected');
    };
  }, [streamId]);

  return (
    <StompContext.Provider
      value={{ client: clientRef.current, connectionState, streamId }}
    >
      {children}
    </StompContext.Provider>
  );
}
