import type { ItemStatus } from '@/types';

export const PRICE_CLASS: Record<ItemStatus, string> = {
  READY: 'text-neutral-500',
  INTRODUCING: 'text-primary-light',
  LIVE: 'text-gold',
  SOLD: 'text-neutral-600',
  UNSOLD: 'text-neutral-600',
};

export const CARD_BORDER_CLASS: Record<ItemStatus, string> = {
  READY: 'border-white/6',
  INTRODUCING: 'border-white/6',
  LIVE: 'border-gold/50',
  SOLD: 'border-white/6',
  UNSOLD: 'border-white/6',
};

export function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}
