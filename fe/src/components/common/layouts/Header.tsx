import { useEffect, useState } from 'react';
import { User, Bell, Home } from 'lucide-react';
import { GrMoney } from 'react-icons/gr';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { useGetUnreadCount } from '@/api/hooks/useGetUnreadCount';
import { useSSE } from '@/hooks/useSSE';
import Logo from '@/assets/Logo.png';
import Button from '../Button';
import NotificationPanel from '../NotificationPanel';
import SearchBar from '../SearchBar';
import { useToast } from '@/hooks/useToast';
import HeaderIcon from './HeaderIcon';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: sellerStatus } = useGetSellerStatus(isLoggedIn);
  const sellerButtonLabel = sellerStatus?.isSeller ? '판매자 센터' : '판매자 등록';
  const sellerButtonPath = sellerStatus?.isSeller ? '/products' : '/seller/register';
  const searchKeyword =
    location.pathname === '/search' ? (new URLSearchParams(location.search).get('keyword')?.trim() ?? '') : '';

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { data: unreadData } = useGetUnreadCount();
  const unreadCount = unreadData ?? 0;

  const { showToast } = useToast();

  useEffect(() => {
    if (!isNotifOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
      }
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

  const handleMyPageClick = () => {
    navigate('/settings');
  };

  const handleSearch = (keyword: string) => {
    if (!keyword) {
      navigate('/search');
      return;
    }

    navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-[1000] flex h-16 items-center gap-4 border-b border-white/5 bg-background/94 backdrop-blur-[20px]">
      <div className="flex w-[240px] shrink-0 items-center justify-between pl-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          aria-label="Go to home"
        >
          <img
            src={Logo}
            alt="Logo"
            className="h-12 w-auto object-contain brightness-0 invert sepia saturate-50 hue-rotate-[350deg]"
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 justify-start pl-2">
        <SearchBar
          key={location.pathname === '/search' ? location.search : location.pathname}
          defaultValue={searchKeyword}
          onSearch={handleSearch}
          maxLength={50}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2 pr-6">
        <button
          type="button"
          onClick={handleSellerButtonClick}
          className="flex h-(--nav-btn-height) items-center gap-1.5 whitespace-nowrap rounded-(--nav-btn-radius) bg-primary/15 px-3.5 text-subtitle-sm text-primary-light transition-all hover:bg-primary/25 hover:text-neutral-100"
        >
          <Home size={14} className="opacity-85" />
          <span>{sellerButtonLabel}</span>
        </button>

        {isLoggedIn ? (
          <>
            <HeaderIcon onClick={() => navigate('/wallet')} ariaLabel="Go to wallet" tooltip="가상머니">
              <GrMoney size={20} />
            </HeaderIcon>
            <div className="relative">
              <HeaderIcon
                onClick={() => setIsNotifOpen((prev) => !prev)}
                ariaLabel="Open alerts"
                tooltip="알림"
                badgeCount={unreadCount > 0 ? unreadCount : undefined}
                hasNoti
              >
                <Bell size={20} />
              </HeaderIcon>
              {isNotifOpen && <NotificationPanel onClose={() => setIsNotifOpen(false)} />}
            </div>
            <HeaderIcon onClick={handleMyPageClick} ariaLabel="Go to my page" tooltip="마이페이지">
              <User size={20} />
            </HeaderIcon>
          </>
        ) : (
          <>
            <Button variant="navSignup" onClick={() => navigate('/signup')} className="px-[18px]">
              회원가입
            </Button>
            <Button variant="navLogin" onClick={() => navigate('/login')} className="px-[18px]">
              로그인
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
