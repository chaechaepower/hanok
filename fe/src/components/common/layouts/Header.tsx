import { useEffect, useRef, useState } from 'react';
import { User, Bell, Home, MapPin, Wallet, ChevronRight } from 'lucide-react';
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
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const setupRef = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useGetUnreadCount();
  const unreadCount = unreadData ?? 0;
  const { data: addressesData } = useGetAddresses(isLoggedIn);
  const { data: walletData } = useGetWallet(isLoggedIn);
  const hasNoAddress = isLoggedIn && addressesData != null && addressesData.length === 0;
  const hasNoBalance = isLoggedIn && walletData != null && (walletData.balance ?? 0) === 0;
  const setupCount = (hasNoAddress ? 1 : 0) + (hasNoBalance ? 1 : 0);

  const { showToast } = useToast();

  useEffect(() => {
    if (!isNotifOpen && !isSetupOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
        setIsSetupOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (isSetupOpen && setupRef.current && !setupRef.current.contains(event.target as Node)) {
        setIsSetupOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen, isSetupOpen]);

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
                  setIsNotifOpen((prev) => {
                    if (!prev) setIsSetupOpen(false);
                    return !prev;
                  });
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
            <div className="relative" ref={setupRef}>
              <HeaderIcon
                onClick={() => {
                  if (setupCount > 0) {
                    setIsSetupOpen((prev) => {
                      if (!prev) setIsNotifOpen(false);
                      return !prev;
                    });
                  } else {
                    handleMyPageClick();
                  }
                }}
                ariaLabel="Go to my page"
                tooltip={setupCount > 0 ? '' : '마이페이지'}
              >
                <User size={20} />
                {setupCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-light opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-light" />
                  </span>
                )}
              </HeaderIcon>

              {isSetupOpen && setupCount > 0 && (
                <div className="absolute right-0 top-full mt-2 w-[280px] rounded-xl border border-white/[0.08] bg-surface p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                  <p className="m-0 mb-3 text-[13px] text-neutral-400">경매 참여를 위해 설정을 완료해주세요</p>
                  <div className="flex flex-col gap-2">
                    {hasNoAddress && (
                      <button
                        onClick={() => { setIsSetupOpen(false); navigate('/settings?tab=shipping'); }}
                        className="flex w-full items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3.5 py-3 text-left cursor-pointer hover:border-gold-light/30 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-light/10">
                          <MapPin size={15} className="text-gold-light" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[13px] text-neutral-200">배송지 등록</span>
                          <span className="block text-[11px] text-neutral-500">낙찰 시 빠른 배송을 위해</span>
                        </div>
                        <ChevronRight size={14} className="shrink-0 text-neutral-600" />
                      </button>
                    )}
                    {hasNoBalance && (
                      <button
                        onClick={() => { setIsSetupOpen(false); navigate('/wallet'); }}
                        className="flex w-full items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3.5 py-3 text-left cursor-pointer hover:border-gold-light/30 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-light/10">
                          <Wallet size={15} className="text-gold-light" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[13px] text-neutral-200">머니 충전</span>
                          <span className="block text-[11px] text-neutral-500">경매 입찰에 필요해요</span>
                        </div>
                        <ChevronRight size={14} className="shrink-0 text-neutral-600" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => { setIsSetupOpen(false); handleMyPageClick(); }}
                    className="mt-3 w-full rounded-lg bg-transparent border-none py-2 text-[12px] text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors"
                  >
                    마이페이지로 이동
                  </button>
                </div>
              )}
            </div>
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
