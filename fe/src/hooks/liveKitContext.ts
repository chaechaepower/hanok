import { createContext, useContext } from 'react';

import type { UseLiveKitReturn } from './useLiveKit';

export const LiveKitContext = createContext<UseLiveKitReturn | null>(null);

export const useLiveKitContext = () => {
  const context = useContext(LiveKitContext);

  if (!context) {
    throw new Error('LiveKitProvider is missing');
  }

  return context;
};
