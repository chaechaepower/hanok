import { MAIN_CATEGORY_ITEMS } from '@/components/Main/mainCategoryItems';

export const inputClass =
  'w-full h-10 bg-background border border-neutral-800 rounded-lg text-neutral-100 text-sm px-4 outline-none focus:border-primary transition-colors';

export const labelClass = 'block text-neutral-100 text-sm font-semibold mb-2';

export const MAX_IMAGES = 3;
export const MAX_HASHTAGS = 7;

export const EMPTY_IMAGE_SLOTS: [string | null, string | null, string | null] = [null, null, null];

export const CATEGORY_OPTIONS = MAIN_CATEGORY_ITEMS.filter((item) => item.id !== 'ALL').map((item) => ({
  value: item.id,
  label: item.label,
}));
