import type { EscrowState } from '@/types';

export type EscrowStatusFilter = EscrowState | 'ALL';

type EscrowStateMeta = {
  label: string;
  badgeClass: string;
};

export const ESCROW_STATE_META: Record<EscrowState, EscrowStateMeta> = {
  DEPOSITED: {
    label: '결제완료',
    badgeClass: 'self-start badge badge-gold-outline',
  },
  SHIPPED: {
    label: '배송중',
    badgeClass: 'self-start badge badge-ember-outline',
  },
  COMPLETED: {
    label: '거래완료',
    badgeClass: 'self-start badge badge-primary-outline',
  },
  CANCELLED: {
    label: '거래취소',
    badgeClass: 'self-start badge badge-neutral',
  },
};

export const ESCROW_STATUS_OPTIONS: Array<{ value: EscrowStatusFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  ...Object.entries(ESCROW_STATE_META).map(([value, meta]) => ({
    value: value as EscrowState,
    label: meta.label,
  })),
];

export const getEscrowStateUI = (state: EscrowState) => {
  const meta = ESCROW_STATE_META[state];

  return {
    label: meta.label,
    badgeClass: meta.badgeClass,
  };
};

export const isTrackingSubmittedEscrowState = (state: EscrowState) => state === 'SHIPPED' || state === 'COMPLETED';

export const isPendingEscrowState = (state: EscrowState) => state === 'DEPOSITED';

export const isCancelledEscrowState = (state: EscrowState) => state === 'CANCELLED';
