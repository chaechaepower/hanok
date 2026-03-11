export const WS_ENDPOINT = '/ws-connect';

export const DESTINATION_PREFIX = {
  BROADCAST: '/broadcast',
  APP: '/app',
  PRIVATE: '/user/private',
} as const;

export const RECONNECT_DELAY = 5000;
export const MAX_CHAT_HISTORY = 200;
