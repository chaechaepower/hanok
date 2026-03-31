import type { PropsWithChildren } from 'react';

import { LiveHotStateContext } from '@/hooks/useLiveHotState';
import type { LiveHotStateStore } from '@/store/liveHotStateStore';

export function LiveHotStateProvider({
  children,
  store,
}: PropsWithChildren<{
  store: LiveHotStateStore;
}>) {
  return <LiveHotStateContext.Provider value={store}>{children}</LiveHotStateContext.Provider>;
}
