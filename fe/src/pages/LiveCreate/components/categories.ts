import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';

// ALL을 제외한 실제 카테고리만 사용
export const CATEGORIES = MAIN_CATEGORY_ITEMS.filter((item) => item.id !== 'ALL').map((item) => ({
  id: item.id,
  label: item.label,
}));

export type CategoryId = string;
