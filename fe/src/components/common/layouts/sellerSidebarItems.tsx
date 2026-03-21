import { FaBox, FaBroadcastTower, FaTruck, FaChartBar } from 'react-icons/fa';

import type { SideBarItem } from '@/types';

export const sellerSidebarItems: SideBarItem[] = [
  { id: 'inventory', label: '내 인벤토리', icon: <FaBox size={18} />, path: '/products' },
  { id: 'live', label: '라이브 방송 관리', icon: <FaBroadcastTower size={18} />, path: '/lives' },
  { id: 'delivery', label: '배송 관리', icon: <FaTruck size={18} />, path: '/tracking' },
  { id: 'report', label: '판매자 리포트', icon: <FaChartBar size={18} />, path: '/seller/report' },
];
