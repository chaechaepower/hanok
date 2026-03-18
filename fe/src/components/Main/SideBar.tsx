import { CATEGORY_ID_TO_LABEL } from '@/constants/category';
import type { SideBarItem } from '@/types';
import {
  Briefcase,
  CreditCard,
  Ellipsis,
  Footprints,
  Gem,
  Landmark,
  Laptop,
  LayoutGrid,
  Palette,
  PuzzleIcon,
  Shirt,
  Watch,
} from 'lucide-react';

export const MAIN_CATEGORY_ITEMS: SideBarItem[] = [
  {
    id: 'ALL',
    label: CATEGORY_ID_TO_LABEL.ALL,
    icon: <LayoutGrid size={20} />,
  },
  {
    id: 'SNEAKERS_SHOES',
    label: CATEGORY_ID_TO_LABEL.SNEAKERS_SHOES,
    icon: <Footprints size={20} />,
  },
  {
    id: 'CLOTHING',
    label: CATEGORY_ID_TO_LABEL.CLOTHING,
    icon: <Shirt size={20} />,
  },
  {
    id: 'WATCHES',
    label: CATEGORY_ID_TO_LABEL.WATCHES,
    icon: <Watch size={20} />,
  },
  {
    id: 'BAGS_FASHION_ACCESSORIES',
    label: CATEGORY_ID_TO_LABEL.BAGS_FASHION_ACCESSORIES,
    icon: <Briefcase size={20} />,
  },
  {
    id: 'JEWELRY',
    label: CATEGORY_ID_TO_LABEL.JEWELRY,
    icon: <Gem size={20} />,
  },
  {
    id: 'TRADING_CARDS',
    label: CATEGORY_ID_TO_LABEL.TRADING_CARDS,
    icon: <CreditCard size={20} />,
  },
  {
    id: 'FIGURES_ARTTOYS_GOODS',
    label: CATEGORY_ID_TO_LABEL.FIGURES_ARTTOYS_GOODS,
    icon: <PuzzleIcon size={20} />,
  },
  {
    id: 'ELECTRONICS',
    label: CATEGORY_ID_TO_LABEL.ELECTRONICS,
    icon: <Laptop size={20} />,
  },
  {
    id: 'ART_PRINTS',
    label: CATEGORY_ID_TO_LABEL.ART_PRINTS,
    icon: <Palette size={20} />,
  },
  {
    id: 'ANTIQUES',
    label: CATEGORY_ID_TO_LABEL.ANTIQUES,
    icon: <Landmark size={20} />,
  },
  {
    id: 'ETC',
    label: CATEGORY_ID_TO_LABEL.ETC,
    icon: <Ellipsis size={20} />,
  },
];
