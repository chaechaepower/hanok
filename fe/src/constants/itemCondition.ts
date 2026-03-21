import type { ItemSyncItemCondition } from '@/types';

export type ItemConditionOption = {
  value: ItemSyncItemCondition;
  label: string;
};

export type ItemConditionBadge = {
  label: string;
  className: string;
};

export const ITEM_CONDITION_LABELS: Record<ItemSyncItemCondition, string> = {
  BRAND_NEW: '미개봉',
  OPEN_BOX: '개봉된 새상품',
  REFURBISHED: '리퍼비시',
  USED: '중고',
};

export const ITEM_CONDITION_OPTIONS: ItemConditionOption[] = Object.entries(ITEM_CONDITION_LABELS).map(
  ([value, label]) => ({
    value: value as ItemSyncItemCondition,
    label,
  }),
);

export const ITEM_CONDITION_BADGE: Record<ItemSyncItemCondition, ItemConditionBadge> = {
  BRAND_NEW: { label: '미개봉', className: 'text-gold-light' },
  OPEN_BOX: { label: '개봉품', className: 'text-gold' },
  REFURBISHED: { label: '리퍼', className: 'text-gold-dark' },
  USED: { label: '중고', className: 'text-gold-muted' },
};

export const getItemConditionLabel = (condition?: string | null) =>
  condition && condition in ITEM_CONDITION_LABELS
    ? ITEM_CONDITION_LABELS[condition as ItemSyncItemCondition]
    : condition ?? '';
