import { useEffect, useState } from 'react';
import { User, Bell, Home, MapPin, Wallet, X } from 'lucide-react';
import { GrMoney } from 'react-icons/gr';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { useGetUnreadCount } from '@/api/hooks/useGetUnreadCount';
import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { useGetWallet } from '@/api/hooks/useGetWallet';
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
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const { data: unreadData } = useGetUnreadCount();
  const unreadCount = unreadData ?? 0;
  const { data: addressesData } = useGetAddresses(isLoggedIn);
  const { data: walletData } = useGetWallet(isLoggedIn);
  const hasNoAddress = isLoggedIn && addressesData != null && addressesData.length === 0;
  const hasNoBalance = isLoggedIn && walletData != null && (walletData.balance ?? 0) === 0;
  const showBanner = !isBannerDismissed && (hasNoAddress || hasNoBalance);

  const { showToast } = useToast();

  useEffect(() => {
    if (!isNotifOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
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
    <>
    <nav className="fixed left-0 right-0 top-0 z-[1000] flex h-16 items-center gap-4 border-b border-white/5 bg-background/94 backdrop-blur-[20px]">
      <div className="flex w-[240px] shrink-0 items-center justify-between pl-6">
        <button
          type="button"
          onClick={() => navigate('/main')}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          aria-label="Go to home"
        >
          <img
            src={Logo}
            alt="Logo"
            className="h-14 w-auto object-contain brightness-0 invert sepia saturate-50 hue-rotate-[350deg]"
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 justify-center px-4">
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
          className="flex h-(--nav-btn-height) items-center gap-1.5 whitespace-nowrap rounded-(--nav-btn-radius) bg-surface-elevated px-3.5 text-subtitle-sm text-primary-light transition-all hover:bg-surface hover:text-neutral-100"
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
                onClick={() => {
                  setIsNotifOpen((prev) => !prev);
                }}
                ariaLabel="Open alerts"
                tooltip="알림"
                badgeCount={unreadCount > 0 ? unreadCount : undefined}
                hasNoti
              >
                <Bell size={20} />
              </HeaderIcon>
              {isNotifOpen && <NotificationPanel onClose={() => setIsNotifOpen(false)} />}
            </div>
            <HeaderIcon
              onClick={handleMyPageClick}
              ariaLabel="Go to my page"
              tooltip="마이페이지"
            >
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

      {showBanner && (
        <div className="fixed left-0 right-0 top-16 z-[999] flex items-center justify-center gap-5 bg-gradient-to-r from-gold-light/[0.08] via-gold-light/[0.05] to-gold-light/[0.08] px-6 py-3 backdrop-blur-sm">
          <span className="text-[14px] font-medium text-gold-light">
            경매 참여를 위해 설정을 완료해주세요
          </span>
          <div className="flex items-center gap-2.5">
            {hasNoAddress && (
              <button
                onClick={() => navigate('/settings?tab=shipping')}
                className="flex items-center gap-1.5 rounded-lg bg-gold-light/10 border border-gold-light/25 px-4 py-1.5 text-[13px] font-bold text-gold-light cursor-pointer hover:bg-gold-light/20 transition-colors"
              >
                <MapPin size={14} />
                배송지 등록
              </button>
            )}
            {hasNoBalance && (
              <button
                onClick={() => navigate('/wallet')}
                className="flex items-center gap-1.5 rounded-lg bg-gold-light/10 border border-gold-light/25 px-4 py-1.5 text-[13px] font-bold text-gold-light cursor-pointer hover:bg-gold-light/20 transition-colors"
              >
                <Wallet size={14} />
                충전하기
              </button>
            )}
          </div>
          <button
            onClick={() => setIsBannerDismissed(true)}
            className="ml-auto flex items-center justify-center rounded-full bg-transparent border-none text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors p-1"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
