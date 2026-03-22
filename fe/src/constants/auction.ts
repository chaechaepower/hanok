import type { AuctionDuration, ItemAuctionType, ItemSyncAuctionStatus } from '@/types';

export const DURATION_OPTIONS: AuctionDuration[] = [10, 30, 60];

export const DURATION_LABELS: Record<AuctionDuration, string> = {
  10: '10초',
  30: '30초',
  60: '1분',
};

export const DURATION_SELECT_OPTIONS = DURATION_OPTIONS.map((duration) => ({
  value: String(duration),
  label: DURATION_LABELS[duration],
}));

export const AUCTION_TYPE_LABELS: Record<ItemAuctionType, string> = {
  BOTTOM_UP: '상향식',
  UNIQUE_TOP: '유일최고가',
};

export const AUCTION_TYPE_DESCRIPTIONS: Record<ItemAuctionType, string> = {
  BOTTOM_UP: `🏁 참가자들이 서로 경쟁하며 가격을 올려갑니다.

💡 더 높은 금액을 입찰하면
현재 최고 입찰자가 됩니다.

⏱ 가장 높은 금액을 제시한 사람이 낙찰됩니다.`,
  UNIQUE_TOP: `🏁 참가자들이 각자 원하는 금액을 한 번씩 응찰합니다.

💡 다른 사람의 금액은 보이지 않습니다.

⏱ 가장 높은 금액을 단독으로 제시한 사람이 낙찰됩니다.`,
};

export const AUCTION_TYPE_OPTIONS: ItemAuctionType[] = ['BOTTOM_UP', 'UNIQUE_TOP'];

export const AUCTION_TYPE_SELECT_OPTIONS = AUCTION_TYPE_OPTIONS.map((auctionType) => ({
  value: auctionType,
  label: AUCTION_TYPE_LABELS[auctionType],
  description: AUCTION_TYPE_DESCRIPTIONS[auctionType],
}));

export const AUCTION_STATUS_BADGES: Record<ItemSyncAuctionStatus, { label: string; className: string }> = {
  READY: { label: '대기', className: 'badge-neutral' },
  INTRODUCING: { label: '설명중', className: 'badge-primary-outline' },
  LIVE: { label: '경매중', className: 'badge-gold-outline' },
  SOLD: { label: '낙찰', className: 'badge-ember-outline' },
  UNSOLD: { label: '유찰', className: 'badge-accent-outline' },
};

export const getAuctionTypeLabel = (auctionType?: string | null) =>
  auctionType && auctionType in AUCTION_TYPE_LABELS
    ? AUCTION_TYPE_LABELS[auctionType as ItemAuctionType]
    : (auctionType ?? '');

export const TIMER_URGENT_THRESHOLD = 5;
