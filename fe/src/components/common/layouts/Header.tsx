import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { FaUser } from 'react-icons/fa';
import { GoBellFill } from 'react-icons/go';
import { IoMdSettings } from 'react-icons/io';
import { TbCircleLetterMFilled } from 'react-icons/tb';
import { HiMiniHome } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { useGetUnreadCount } from '@/api/hooks/useGetUnreadCount';
import { useSSE } from '@/hooks/useSSE';
import { useToast } from '@/components/common/Toast/useToast';
import Logo from '@/assets/Logo.png';
import SearchBar from '../SearchBar';
import Button from '../Button';
import NotificationPanel from '../NotificationPanel';

export default function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: sellerStatus } = useGetSellerStatus(isLoggedIn);
  const sellerButtonLabel = sellerStatus?.isSeller ? '판매자 센터' : '판매자 등록';
  const sellerButtonPath = sellerStatus?.isSeller ? '/products' : '/seller/register';

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { data: unreadData } = useGetUnreadCount();
  const unreadCount = unreadData ?? 0;

  const { showToast } = useToast();

  useEffect(() => {
    if (!isNotifOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsNotifOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isNotifOpen]);

  useSSE({
    enabled: isLoggedIn,
    onNotification: (notification) => {
      showToast({ title: notification.title, message: notification.body });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const handleSellerButtonClick = () => {
    navigate(isLoggedIn ? sellerButtonPath : '/login');
  };

  const handleProfileClick = () => {
    const userId = localStorage.getItem('userId');
    navigate(userId ? `/profile/${userId}` : '/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] flex h-16 items-center gap-4 border-b border-white/5 bg-background/94 px-6 backdrop-blur-[20px]">
      {/* ── 좌측: 로고 + 디바이더 + 판매자 버튼 ── */}
      <div className="flex shrink-0 items-center gap-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          aria-label="Go to home"
        >
          <img src={Logo} alt="Logo" className="h-9 w-auto object-contain" />
        </button>

        <div className="h-7 w-px shrink-0 bg-warm/6" />

        <button
          type="button"
          onClick={handleSellerButtonClick}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-primary/35 bg-primary/15 px-3.5 py-[7px] text-subtitle-sm text-primary-light transition-all hover:border-primary/50 hover:bg-primary/25 hover:text-neutral-100"
        >
          <HiMiniHome className="h-3.5 w-3.5 opacity-85" />
          <span>{sellerButtonLabel}</span>
        </button>
      </div>

      {/* ── 중앙: 검색바 ── */}
      <div className="flex min-w-0 flex-1 justify-center px-5">
        <SearchBar />
      </div>

      {/* ── 우측 ── */}
      {isLoggedIn ? (
        <div className="flex shrink-0 items-center gap-1">
          <HeaderIcon onClick={() => navigate('/wallet')} ariaLabel="Go to wallet" tooltip="가상머니">
            <TbCircleLetterMFilled className="h-5 w-5 fill-current stroke-none" />
          </HeaderIcon>
          <div className="relative">
            <HeaderIcon onClick={() => setIsNotifOpen((prev) => !prev)} ariaLabel="Open alerts" tooltip="알림" badgeCount={unreadCount > 0 ? unreadCount : undefined} hasNoti>
              <GoBellFill className="h-5 w-5" />
            </HeaderIcon>
            {isNotifOpen && <NotificationPanel onClose={() => setIsNotifOpen(false)} />}
          </div>
          <HeaderIcon onClick={() => navigate('/settings')} ariaLabel="Go to settings" tooltip="설정">
            <IoMdSettings className="h-5 w-5" />
          </HeaderIcon>

          <div className="mx-1.5 h-6 w-px shrink-0 bg-warm/5" />

          <button
            type="button"
            onClick={handleProfileClick}
            aria-label="Go to profile"
            className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] border border-primary/20 bg-primary/10 text-primary transition-all hover:border-primary/40 hover:bg-primary/20"
          >
            <FaUser className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="navSignup" size="small" onClick={() => navigate('/signup')} className="px-[18px] py-2">
            회원가입
          </Button>
          <Button variant="navLogin" size="small" onClick={() => navigate('/login')} className="px-[18px] py-2">
            로그인
          </Button>
        </div>
      )}
    </nav>
  );
}

type HeaderIconProps = {
  children: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  tooltip: string;
  badgeCount?: number;
  hasNoti?: boolean;
};

function HeaderIcon({ children, onClick, ariaLabel, tooltip, badgeCount, hasNoti }: HeaderIconProps) {
  return (
    <div className="group relative flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-all hover:border-warm/6 hover:bg-warm/5 active:scale-95 ${hasNoti ? 'text-neutral-200 hover:text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
      >
        {children}
        {badgeCount != null && badgeCount > 0 && (
          <span className="pointer-events-none absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-accent px-[5px] text-[10px] font-[800] text-white animate-badge-pulse">
            {badgeCount}
          </span>
        )}
      </button>
      <span className="pointer-events-none absolute top-full z-10 mt-2 whitespace-nowrap rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {tooltip}
      </span>
    </div>
  );
}
