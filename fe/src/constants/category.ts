export const CATEGORY_ID_TO_LABEL = {
  ALL: '전체',
  SNEAKERS_SHOES: '스니커즈/신발',
  CLOTHING: '의류',
  WATCHES: '시계',
  BAGS_FASHION_ACCESSORIES: '가방/패션잡화',
  JEWELRY: '주얼리',
  TRADING_CARDS: '트레이딩 카드',
  FIGURES_ARTTOYS_GOODS: '피규어/아트토이/굿즈',
  ELECTRONICS: '전자기기',
  ART_PRINTS: '미술품/판화',
  ANTIQUES: '골동품/앤틱',
  ETC: '기타',
} as const;

export const MAIN_CATEGORY_IDS = [
  'SNEAKERS_SHOES',
  'CLOTHING',
  'WATCHES',
  'BAGS_FASHION_ACCESSORIES',
  'JEWELRY',
  'TRADING_CARDS',
  'FIGURES_ARTTOYS_GOODS',
  'ELECTRONICS',
  'ART_PRINTS',
  'ANTIQUES',
  'ETC',
] as const;

export type CategoryId = keyof typeof CATEGORY_ID_TO_LABEL;
export type MainCategoryId = (typeof MAIN_CATEGORY_IDS)[number];

export const getCategoryLabel = (categoryId: string) =>
  CATEGORY_ID_TO_LABEL[categoryId as keyof typeof CATEGORY_ID_TO_LABEL] ?? categoryId;

export const CATEGORIES = MAIN_CATEGORY_IDS.map((id) => ({
  id,
  label: getCategoryLabel(id),
}));
