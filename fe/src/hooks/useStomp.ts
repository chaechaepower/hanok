import { useContext } from 'react';
import { StompContext } from '@/provider/StompContext';
import type { StompContextValue } from '@/provider/StompContext';

export function useStomp(): StompContextValue {
  const ctx = useContext(StompContext);
  if (!ctx) {
    throw new Error('useStomp must be used within a StompProvider');
  }
  return ctx;
}
