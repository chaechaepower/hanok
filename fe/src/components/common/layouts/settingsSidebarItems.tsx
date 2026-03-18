import { BiSolidPurchaseTag } from 'react-icons/bi';
import { FaCreditCard, FaHeart, FaMapMarkerAlt, FaUserAlt } from 'react-icons/fa';

import type { SideBarItem } from '@/types';

export const settingsSidebarItems: SideBarItem[] = [
  { id: 'account', label: '계정 관리', icon: <FaUserAlt size={18} /> },
  { id: 'stores', label: '팔로우한 스토어', icon: <FaHeart size={18} /> },
  { id: 'shipping', label: '배송지 관리', icon: <FaMapMarkerAlt size={18} /> },
  { id: 'payment', label: '결제수단 관리', icon: <FaCreditCard size={18} /> },
  { id: 'order', label: '구매 내역', icon: <BiSolidPurchaseTag size={18} /> },
];
