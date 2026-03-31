import { useEffect } from 'react';

type RenderStat = {
  name: string;
  renders: number;
  lastRenderedAt: string;
};

type RenderStatsController = {
  enable: () => void;
  disable: () => void;
  enabled: () => boolean;
  reset: () => void;
  dump: (name?: string) => RenderStat[] | RenderStat | null;
  list: () => string[];
};

declare global {
  interface Window {
    __liveRenderStats?: RenderStatsController;
  }
}

const STORAGE_KEY = 'liveRenderStats';
const registry = new Map<string, RenderStat>();

const isEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === '1';
};

const ensureController = () => {
  if (typeof window === 'undefined' || window.__liveRenderStats) {
    return;
  }

  window.__liveRenderStats = {
    enable: () => {
      window.localStorage.setItem(STORAGE_KEY, '1');
    },
    disable: () => {
      window.localStorage.removeItem(STORAGE_KEY);
    },
    enabled: () => isEnabled(),
    reset: () => {
      registry.clear();
    },
    dump: (name) => {
      if (name) {
        return registry.get(name) ?? null;
      }

      return [...registry.values()];
    },
    list: () => [...registry.keys()],
  };
};

ensureController();

export function useRenderStats(name: string) {
  useEffect(() => {
    ensureController();

    if (!isEnabled()) {
      return;
    }

    const prev = registry.get(name);
    registry.set(name, {
      name,
      renders: (prev?.renders ?? 0) + 1,
      lastRenderedAt: new Date().toISOString(),
    });
  });
}
