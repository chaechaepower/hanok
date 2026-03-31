import { useEffect } from 'react';

const LIVE_RENDER_STATS_STORAGE_KEY = 'liveRenderStats';

type RenderStat = {
  renders: number;
  lastRenderedAt: number;
};

type RenderStatSnapshot = {
  name: string;
  renders: number;
  lastRenderedAt: string;
};

type RenderStatsController = {
  enabled: () => boolean;
  enable: () => void;
  disable: () => void;
  list: () => string[];
  reset: (name?: string) => void;
  dump: (name?: string) => RenderStatSnapshot | RenderStatSnapshot[] | null;
};

declare global {
  interface Window {
    __liveRenderStatsRegistry?: Map<string, RenderStat>;
    __liveRenderStats?: RenderStatsController;
  }
}

const isLiveRenderStatsEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(LIVE_RENDER_STATS_STORAGE_KEY) === '1';
};

const buildSnapshot = (name: string, stat: RenderStat): RenderStatSnapshot => ({
  name,
  renders: stat.renders,
  lastRenderedAt: new Date(stat.lastRenderedAt).toISOString(),
});

const getRegistry = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.__liveRenderStatsRegistry) {
    window.__liveRenderStatsRegistry = new Map<string, RenderStat>();
  }

  if (!window.__liveRenderStats) {
    window.__liveRenderStats = {
      enabled: () => isLiveRenderStatsEnabled(),
      enable: () => {
        window.localStorage.setItem(LIVE_RENDER_STATS_STORAGE_KEY, '1');
      },
      disable: () => {
        window.localStorage.setItem(LIVE_RENDER_STATS_STORAGE_KEY, '0');
      },
      list: () => [...window.__liveRenderStatsRegistry!.keys()],
      reset: (name) => {
        if (name) {
          window.__liveRenderStatsRegistry!.delete(name);
          return;
        }

        window.__liveRenderStatsRegistry!.clear();
      },
      dump: (name) => {
        if (name) {
          const stat = window.__liveRenderStatsRegistry!.get(name);
          const snapshot = stat ? buildSnapshot(name, stat) : null;
          console.info('[live-render-stats] snapshot', snapshot);
          return snapshot;
        }

        const snapshot = [...window.__liveRenderStatsRegistry!.entries()].map(([key, value]) => buildSnapshot(key, value));
        console.info('[live-render-stats] snapshot', snapshot);
        return snapshot;
      },
    };
  }

  return window.__liveRenderStatsRegistry;
};

const trackRender = (name: string) => {
  if (!isLiveRenderStatsEnabled()) {
    return;
  }

  const registry = getRegistry();

  if (!registry) {
    return;
  }

  const existing = registry.get(name);

  if (existing) {
    existing.renders += 1;
    existing.lastRenderedAt = Date.now();
    return;
  }

  registry.set(name, {
    renders: 1,
    lastRenderedAt: Date.now(),
  });
};

export function useRenderStats(name: string) {
  useEffect(() => {
    trackRender(name);
  });
}
