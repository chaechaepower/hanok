import { useContext } from 'react';
import { StompContext } from '@/provider/StompProvider';
import type { StompContextValue } from '@/provider/StompProvider';

export function useStomp(): StompContextValue {
  const ctx = useContext(StompContext);
  if (!ctx) {
    throw new Error('useStomp must be used within a StompProvider');
  }
  return ctx;
}
