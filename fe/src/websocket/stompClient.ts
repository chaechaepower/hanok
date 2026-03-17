import { Client, type IMessage, type StompHeaders, type StompSubscription } from '@stomp/stompjs';

import {
  STREAM_SOCKET_DESTINATIONS,
  getStreamSocketConnectHeaders,
  getStreamSocketConnectUrl,
  parseStompMessageBody,
} from './socket';

export type StompConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export type StompMessageHandler<T = unknown> = (payload: T, message: IMessage) => void;

type ManagedSubscription = {
  id: string;
  destination: string;
  callback: (message: IMessage) => void;
  headers?: StompHeaders;
  active?: StompSubscription;
};

type StreamSubscriptionOptions<TBroadcast = unknown, TPrivate = unknown, TError = unknown> = {
  streamId: number | string;
  onBroadcast?: StompMessageHandler<TBroadcast>;
  onPrivate?: StompMessageHandler<TPrivate>;
  onError?: StompMessageHandler<TError>;
  broadcastHeaders?: StompHeaders;
  privateHeaders?: StompHeaders;
  errorHeaders?: StompHeaders;
};

let client: Client | null = null;
let connectPromise: Promise<Client> | null = null;
let resolveConnect: ((client: Client) => void) | null = null;
let rejectConnect: ((error: Error) => void) | null = null;
let connectionState: StompConnectionState = 'idle';
let subscriptionSequence = 0;

const connectionStateListeners = new Set<(state: StompConnectionState) => void>();
const managedSubscriptions = new Map<string, ManagedSubscription>();

const setConnectionState = (nextState: StompConnectionState) => {
  connectionState = nextState;
  connectionStateListeners.forEach((listener) => listener(nextState));
};

const clearPendingConnection = () => {
  connectPromise = null;
  resolveConnect = null;
  rejectConnect = null;
};

const resolvePendingConnection = (activeClient: Client) => {
  resolveConnect?.(activeClient);
  clearPendingConnection();
};

const rejectPendingConnection = (error: Error) => {
  rejectConnect?.(error);
  clearPendingConnection();
};

const subscribeEntry = (entry: ManagedSubscription, activeClient: Client) => {
  entry.active?.unsubscribe();
  entry.active = activeClient.subscribe(entry.destination, entry.callback, entry.headers);
};

const resubscribeAll = (activeClient: Client) => {
  managedSubscriptions.forEach((entry) => {
    subscribeEntry(entry, activeClient);
  });
};

const createClient = () => {
  const nextClient = new Client({
    brokerURL: getStreamSocketConnectUrl(),
    connectHeaders: getStreamSocketConnectHeaders(),
    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    debug: import.meta.env.DEV ? (message) => console.debug(`[stomp] ${message}`) : () => {},
  });

  nextClient.onConnect = () => {
    setConnectionState('connected');
    resubscribeAll(nextClient);
    resolvePendingConnection(nextClient);
  };

  nextClient.onDisconnect = () => {
    setConnectionState('disconnected');
  };

  nextClient.onStompError = (frame) => {
    console.error('[stomp] broker error', frame.headers.message, frame.body);
    setConnectionState('error');
    rejectPendingConnection(new Error(frame.headers.message ?? 'STOMP broker error'));
  };

  nextClient.onWebSocketError = () => {
    setConnectionState('error');
    rejectPendingConnection(new Error('WebSocket error while connecting the STOMP client.'));
  };

  nextClient.onWebSocketClose = () => {
    managedSubscriptions.forEach((entry) => {
      entry.active = undefined;
    });

    if (connectionState === 'connecting') {
      rejectPendingConnection(new Error('STOMP connection closed before it was established.'));
    }

    if (nextClient.active) {
      setConnectionState('disconnected');
      return;
    }

    setConnectionState('idle');
  };

  return nextClient;
};

const getClient = () => {
  if (!client) {
    client = createClient();
  }

  return client;
};

const registerSubscription = (
  destination: string,
  callback: (message: IMessage) => void,
  headers?: StompHeaders,
) => {
  const id = `subscription-${subscriptionSequence++}`;
  const entry: ManagedSubscription = {
    id,
    destination,
    callback,
    headers,
  };

  managedSubscriptions.set(id, entry);

  if (client?.connected) {
    subscribeEntry(entry, client);
  }

  return () => {
    entry.active?.unsubscribe();
    managedSubscriptions.delete(entry.id);

    if (managedSubscriptions.size === 0) {
      void disconnectStompClient();
    }
  };
};

export const getStompConnectionState = () => connectionState;

export const subscribeToStompConnectionState = (listener: (state: StompConnectionState) => void) => {
  connectionStateListeners.add(listener);
  listener(connectionState);

  return () => {
    connectionStateListeners.delete(listener);
  };
};

export const connectStompClient = async () => {
  const activeClient = getClient();

  if (activeClient.connected) {
    setConnectionState('connected');
    return activeClient;
  }

  if (!connectPromise) {
    activeClient.brokerURL = getStreamSocketConnectUrl();
    activeClient.connectHeaders = getStreamSocketConnectHeaders();
    setConnectionState('connecting');

    connectPromise = new Promise<Client>((resolve, reject) => {
      resolveConnect = resolve;
      rejectConnect = reject;
    });

    if (!activeClient.active) {
      activeClient.activate();
    }
  }

  return connectPromise;
};

export const disconnectStompClient = async () => {
  if (!client) {
    setConnectionState('idle');
    return;
  }

  rejectPendingConnection(new Error('STOMP client was disconnected before the connection completed.'));

  const activeClient = client;
  client = null;

  if (activeClient.active) {
    await activeClient.deactivate();
  }

  managedSubscriptions.forEach((entry) => {
    entry.active = undefined;
  });

  setConnectionState('idle');
};

export const subscribeStream = async <TBroadcast = unknown, TPrivate = unknown, TError = unknown>({
  streamId,
  onBroadcast,
  onPrivate,
  onError,
  broadcastHeaders,
  privateHeaders,
  errorHeaders,
}: StreamSubscriptionOptions<TBroadcast, TPrivate, TError>) => {
  await connectStompClient();

  const unsubscribers: Array<() => void> = [];

  if (onBroadcast) {
    unsubscribers.push(
      registerSubscription(
        STREAM_SOCKET_DESTINATIONS.broadcast(streamId),
        (message) => {
          onBroadcast(parseStompMessageBody<TBroadcast>(message), message);
        },
        broadcastHeaders,
      ),
    );
  }

  if (onPrivate) {
    unsubscribers.push(
      registerSubscription(
        STREAM_SOCKET_DESTINATIONS.private(streamId),
        (message) => {
          onPrivate(parseStompMessageBody<TPrivate>(message), message);
        },
        privateHeaders,
      ),
    );
  }

  if (onError) {
    unsubscribers.push(
      registerSubscription(
        STREAM_SOCKET_DESTINATIONS.errors(),
        (message) => {
          onError(parseStompMessageBody<TError>(message), message);
        },
        errorHeaders,
      ),
    );
  }

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};

export const sendStreamMessage = async <TPayload>(
  streamId: number | string,
  payload: TPayload,
  headers?: StompHeaders,
) => {
  const activeClient = await connectStompClient();
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

  activeClient.publish({
    destination: STREAM_SOCKET_DESTINATIONS.send(streamId),
    body,
    headers,
  });
};
