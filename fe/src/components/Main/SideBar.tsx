import type { SideBarItem } from '@/types';
import {
  LayoutGrid,
  Footprints,
  Shirt,
  Watch,
  Briefcase,
  Gem,
  CreditCard,
  PuzzleIcon,
  Laptop,
  Palette,
  Landmark,
  Ellipsis,
} from 'lucide-react';

export const MAIN_CATEGORY_ITEMS: SideBarItem[] = [
  {
    id: 'ALL',
    label: '전체',
    icon: <LayoutGrid size={20} />,
  },
  {
    id: 'SNEAKERS_SHOES',
    label: '스니커즈/신발',
    icon: <Footprints size={20} />,
  },
  {
    id: 'CLOTHING',
    label: '의류',
    icon: <Shirt size={20} />,
  },
  {
    id: 'WATCHES',
    label: '시계',
    icon: <Watch size={20} />,
  },
  {
    id: 'BAGS_FASHION_ACCESSORIES',
    label: '가방/패션잡화',
    icon: <Briefcase size={20} />,
  },
  {
    id: 'JEWELRY',
    label: '주얼리',
    icon: <Gem size={20} />,
  },
  {
    id: 'TRADING_CARDS',
    label: '트레이딩 카드',
    icon: <CreditCard size={20} />,
  },
  {
    id: 'FIGURES_ARTTOYS_GOODS',
    label: '피규어/아트토이/굿즈',
    icon: <PuzzleIcon size={20} />,
  },
  {
    id: 'ELECTRONICS',
    label: '전자기기',
    icon: <Laptop size={20} />,
  },
  {
    id: 'ART_PRINTS',
    label: '미술품/판화',
    icon: <Palette size={20} />,
  },
  {
    id: 'ANTIQUES',
    label: '골동품/앤틱',
    icon: <Landmark size={20} />,
  },
  {
    id: 'ETC',
    label: '기타',
    icon: <Ellipsis size={20} />,
  },
];
