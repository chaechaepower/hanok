import type { ItemStatus, Product } from '@/types';

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

export const LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM: Product = {
  itemId: -1,
  status: 'READY',
  name: '예시 상품 · 빈티지 카메라',
  description: '튜토리얼용 예시 상품입니다.',
  tags: ['튜토리얼'],
  images: [],
  startPrice: 85000,
  bidUnit: 5000,
  auctionDuration: 60,
  itemCondition: 'OPEN_BOX',
  category: 'tutorial',
  auctionType: 'BOTTOM_UP',
};
