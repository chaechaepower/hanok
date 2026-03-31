import { createContext, useContext, useSyncExternalStore } from 'react';

import type { LiveHotState, LiveHotStateStore } from '../store/liveHotStateStore';

export const LiveHotStateContext = createContext<LiveHotStateStore | null>(null);

const useLiveHotStateStore = () => {
  const store = useContext(LiveHotStateContext);

  if (!store) {
    throw new Error('LiveHotStateProvider is missing');
  }

  return store;
};

const useLiveHotSlice = <T,>(selector: (state: LiveHotState) => T) => {
  const store = useLiveHotStateStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(store.getSnapshot()),
  );
};

export const useLiveTimer = () => useLiveHotSlice((state) => state.timer);
export const useLiveBidSync = () => useLiveHotSlice((state) => state.bidSync);
export const useLiveUniqueBidSync = () => useLiveHotSlice((state) => state.uniqueBidSync);
export const useLiveAuctionStatistics = () => useLiveHotSlice((state) => state.auctionStatistics);
export const useLiveAuctionComment = () => useLiveHotSlice((state) => state.auctionComment);
