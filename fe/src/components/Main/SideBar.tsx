import type { SideBarItem } from '@/types';
import {
  FaClock,
  FaEllipsisH,
  FaGem,
  FaLandmark,
  FaLaptop,
  FaPalette,
  FaPuzzlePiece,
  FaShoePrints,
  FaSuitcase,
  FaThLarge,
  FaTshirt,
  FaRegCreditCard,
} from 'react-icons/fa';

export const MAIN_CATEGORY_ITEMS: SideBarItem[] = [
  {
    id: 'ALL',
    label: '전체',
    icon: <FaThLarge />,
  },
  {
    id: 'SNEAKERS_SHOES',
    label: '스니커즈/신발',
    icon: <FaShoePrints />,
  },
  {
    id: 'CLOTHING',
    label: '의류',
    icon: <FaTshirt />,
  },
  {
    id: 'WATCHES',
    label: '시계',
    icon: <FaClock />,
  },
  {
    id: 'BAGS_FASHION_ACCESSORIES',
    label: '가방/패션잡화',
    icon: <FaSuitcase />,
  },
  {
    id: 'JEWELRY',
    label: '주얼리',
    icon: <FaGem />,
  },
  {
    id: 'TRADING_CARDS',
    label: '트레이딩 카드',
    icon: <FaRegCreditCard />,
  },
  {
    id: 'FIGURES_ARTTOYS_GOODS',
    label: '피규어/아트토이/굿즈',
    icon: <FaPuzzlePiece />,
  },
  {
    id: 'ELECTRONICS',
    label: '전자기기',
    icon: <FaLaptop />,
  },
  {
    id: 'ART_PRINTS',
    label: '미술품/판화',
    icon: <FaPalette />,
  },
  {
    id: 'ANTIQUES',
    label: '골동품/앤틱',
    icon: <FaLandmark />,
  },
  {
    id: 'ETC',
    label: '기타',
    icon: <FaEllipsisH />,
  },
];
