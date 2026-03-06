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
    id: '스니커즈/신발',
    label: '스니커즈/신발',
    icon: <FaShoePrints />,
  },
  {
    id: '의류',
    label: '의류',
    icon: <FaTshirt />,
  },
  {
    id: '시계',
    label: '시계',
    icon: <FaClock />,
  },
  {
    id: '가방/패션잡화',
    label: '가방/패션잡화',
    icon: <FaSuitcase />,
  },
  {
    id: '주얼리',
    label: '주얼리',
    icon: <FaGem />,
  },
  {
    id: '트레이딩 카드',
    label: '트레이딩 카드',
    icon: <FaRegCreditCard />,
  },
  {
    id: '피규어/아트토이/굿즈',
    label: '피규어/아트토이/굿즈',
    icon: <FaPuzzlePiece />,
  },
  {
    id: '전자기기',
    label: '전자기기',
    icon: <FaLaptop />,
  },
  {
    id: '미술품/판화',
    label: '미술품/판화',
    icon: <FaPalette />,
  },
  {
    id: '골동품/앤틱',
    label: '골동품/앤틱',
    icon: <FaLandmark />,
  },
  {
    id: '기타',
    label: '기타',
    icon: <FaEllipsisH />,
  },
];
