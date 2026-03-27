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
  BRAND_NEW: '미개봉 새제품',
  OPEN_BOX: '개봉된 새상품',
  REFURBISHED: '리퍼비시',
  USED: '중고',
};

const ITEM_CONDITION_OPTION_VALUES: ItemSyncItemCondition[] = ['BRAND_NEW', 'OPEN_BOX', 'REFURBISHED', 'USED'];

export const ITEM_CONDITION_OPTIONS: ItemConditionOption[] = ITEM_CONDITION_OPTION_VALUES.map((value) => ({
  value,
  label: ITEM_CONDITION_LABELS[value],
}));

export const getItemConditionLabel = (condition?: string | null) =>
  condition && condition in ITEM_CONDITION_LABELS
    ? ITEM_CONDITION_LABELS[condition as ItemSyncItemCondition]
    : (condition ?? '');
