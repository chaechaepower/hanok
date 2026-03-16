import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';

export const CATEGORIES = MAIN_CATEGORY_ITEMS.filter((item) => item.id !== 'ALL').map((item) => ({
  id: item.id,
  label: item.label,
}));

export type CategoryId = string;
