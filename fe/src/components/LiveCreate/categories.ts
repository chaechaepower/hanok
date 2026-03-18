import { MAIN_CATEGORY_IDS, getCategoryLabel } from '@/constants/category';

export const CATEGORIES = MAIN_CATEGORY_IDS.map((id) => ({
  id,
  label: getCategoryLabel(id),
}));

export type CategoryId = string;
