export const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#insta-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="insta-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export const YoutubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const TiktokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-1.45 4.29-3.52 5.14-2.11.87-4.63.46-6.38-1.01-1.66-1.4-2.31-3.78-1.66-5.88.58-1.9 2.05-3.4 3.96-3.95 2.02-.59 4.26-.06 5.8 1.25V13.88c-.97-.52-2.09-.76-3.21-.73-1.67.04-3.24 1.05-3.96 2.54-.7 1.45-.66 3.25.12 4.67.75 1.34 2.21 2.15 3.73 2.12 1.48-.02 2.87-.84 3.58-2.11.39-.7.58-1.5.58-2.31.02-3.83.01-7.66.01-11.49z"/>
  </svg>
);

import { FiBell, FiCalendar, FiClock, FiGift, FiTruck } from 'react-icons/fi';

export const BellIcon = () => <FiBell size={20} color="#D9B36D" />;
export const CalendarIcon = () => <FiCalendar size={16} color="#888" />;
export const HistoryIcon = () => <FiClock size={18} color="currentColor" />;
export const GiftIcon = () => <FiGift size={32} color="#D9B36D" />;
export const TruckIcon = () => <FiTruck size={24} color="#D9B36D" />;
