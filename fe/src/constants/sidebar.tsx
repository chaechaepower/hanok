import { FaBox, FaBroadcastTower, FaTruck, FaChartBar } from 'react-icons/fa';
import { BiSolidPurchaseTag } from 'react-icons/bi';
import { FaCreditCard, FaHeart, FaMapMarkerAlt, FaUserAlt } from 'react-icons/fa';

import type { SideBarItem } from '@/types';

export const sellerSidebarItems: SideBarItem[] = [
  { id: 'inventory', label: '내 인벤토리', icon: <FaBox size={18} />, path: '/products' },
  { id: 'live', label: '라이브 방송 관리', icon: <FaBroadcastTower size={18} />, path: '/lives' },
  { id: 'delivery', label: '배송 관리', icon: <FaTruck size={18} />, path: '/tracking' },
  { id: 'report', label: '판매자 리포트', icon: <FaChartBar size={18} />, path: '/seller/report' },
];

export const settingsSidebarItems: SideBarItem[] = [
  { id: 'order', label: '구매 내역', icon: <BiSolidPurchaseTag size={18} /> },
  { id: 'stores', label: '팔로우한 스토어', icon: <FaHeart size={18} /> },
  { id: 'shipping', label: '배송지 관리', icon: <FaMapMarkerAlt size={18} /> },
  { id: 'payment', label: '결제수단 관리', icon: <FaCreditCard size={18} /> },
  { id: 'account', label: '계정 관리', icon: <FaUserAlt size={18} /> },
];
