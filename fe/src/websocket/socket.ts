import { StompHeaders, type IMessage } from '@stomp/stompjs';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const STREAM_SOCKET_DESTINATIONS = {
  broadcast: (streamId: number | string) => `/broadcast/streams/${streamId}`,
  private: (streamId: number | string) => `/user/private/streams/${streamId}`,
  send: (streamId: number | string) => `/app/streams/${streamId}`,
};

export const getStoredAccessToken = () => localStorage.getItem('accessToken');

export const getStreamSocketConnectUrl = () => {
  const connectUrl = import.meta.env.VITE_WS_CONNECT_URL;

  if (!connectUrl) {
    throw new Error('VITE_WS_CONNECT_URL is required for the STOMP connection.');
  }

  const url = new URL(connectUrl);

  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('VITE_WS_CONNECT_URL must use the ws:// or wss:// protocol.');
  }

  return stripTrailingSlash(url.toString());
};

export const getStreamSocketConnectHeaders = (): StompHeaders => {
  const headers = new StompHeaders();
  const token = getStoredAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const parseStompMessageBody = <T>(message: IMessage) => {
  if (!message.body) {
    return null as T;
  }

  try {
    return JSON.parse(message.body) as T;
  } catch {
    return message.body as T;
  }
};
