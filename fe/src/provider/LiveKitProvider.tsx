import type { PropsWithChildren } from 'react';

import { LiveKitContext } from '@/hooks/liveKitContext';
import { useLiveKit } from '@/hooks/useLiveKit';

interface Props {
  serverUrl: string;
  token: string;
  isHost: boolean;
}

export function LiveKitProvider({ children, serverUrl, token, isHost }: PropsWithChildren<Props>) {
  const livekit = useLiveKit({
    serverUrl,
    token,
    isHost,
  });

  return <LiveKitContext.Provider value={livekit}>{children}</LiveKitContext.Provider>;
}
