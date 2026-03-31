const DEFAULT_LIVE_STRUCTURE_OPTIMIZATION_ENABLED = true;
const LIVE_STRUCTURE_OPTIMIZATION_STORAGE_KEY = 'liveStructureOptimization';

export const isLiveStructureOptimizationEnabled = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LIVE_STRUCTURE_OPTIMIZATION_ENABLED;
  }

  const override = window.localStorage.getItem(LIVE_STRUCTURE_OPTIMIZATION_STORAGE_KEY);

  if (override === '0') {
    return false;
  }

  if (override === '1') {
    return true;
  }

  return DEFAULT_LIVE_STRUCTURE_OPTIMIZATION_ENABLED;
};
