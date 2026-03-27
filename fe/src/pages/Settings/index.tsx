import { useMemo, useRef, useState } from 'react';
import { FaStore, FaWallet, FaMapMarkerAlt } from 'react-icons/fa';
import { FiCamera, FiLogOut, FiChevronRight } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useGetMe } from '@/api/hooks/useGetMe';
import { useGetNotification } from '@/api/hooks/useGetNotification';
import { useLogout as useLogout } from '@/api/hooks/usePostLogout';
import { usePatchProfileImage } from '@/api/hooks/usePatchProfileImage';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { useGetAccount } from '@/api/hooks/useGetAccount';
import { motion } from 'framer-motion';
import AccountSection from '@/components/Settings/accountSection';
import FollowedStoresSection from '@/components/Settings/FollowedStoresSection';
import OrderHistorySection from '@/components/Settings/orderHistory/OrderHistorySection';
import PaymentSection from '@/components/Settings/PaymentSection';
import ShippingSection from '@/components/Settings/ShippingSection';
import { formatPrice } from '@/utils/formatPrice';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';
import { useToast } from '@/hooks/useToast';
import { settingsSidebarItems } from '@/constants/sidebar';

const SetupDot = () => (
  <span className="flex h-[18px] items-center rounded-full bg-gold-light/15 px-1.5 text-[11px] font-bold text-gold-light">
    설정
  </span>
);

type SettingsTab = 'account' | 'stores' | 'shipping' | 'payment' | 'order';
const SETTINGS_TABS: SettingsTab[] = ['account', 'stores', 'shipping', 'payment', 'order'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = SETTINGS_TABS.includes(tabParam as SettingsTab) ? (tabParam as SettingsTab) : 'order';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [autoOpenAddressModal, setAutoOpenAddressModal] = useState(false);

  const { data: meData, isLoading: isMeLoading } = useGetMe();
  const { isLoading: isNotiLoading } = useGetNotification();
  const { data: walletData, isLoading: isWalletLoading } = useGetWallet();
  const { data: addressesData } = useGetAddresses();
  const { data: accountData } = useGetAccount();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const { mutate: patchProfileImage } = usePatchProfileImage();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { optimizeImage } = await import('@/utils/imageOptimizer');
    const optimized = await optimizeImage(file);

    patchProfileImage(optimized, {
      onSuccess: () => {
        showToast({ type: 'success', message: '프로필 이미지가 변경되었습니다.' });
      },
      onError: (error) => {
        showToast({ type: 'error', message: getUploadErrorMessage(error, '프로필 이미지 변경에 실패했습니다.') });
      },
    });
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
      onError: () => {
        showToast({ type: 'error', message: '로그아웃에 실패했습니다.' });
      },
    });
  };

  const hasAddress = (addressesData?.length ?? 0) > 0;
  const hasAccount = !!(accountData?.bankName && accountData?.accountNum);

  const sidebarItems = useMemo(() => {
    const needsBadge: Record<string, boolean> = {
      shipping: !hasAddress,
      payment: !hasAccount,
    };
    return settingsSidebarItems.map((item) =>
      needsBadge[item.id] ? { ...item, badge: <SetupDot /> } : item,
    );
  }, [hasAddress, hasAccount]);

  if (isMeLoading || isNotiLoading || isWalletLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-gold-light" />
        <p className="mt-3 text-neutral-400">정보를 불러오는 중입니다</p>
      </div>
    );
  }

  const user = meData;
  const defaultAddress = addressesData?.find((a) => a.isDefault) ?? addressesData?.[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 box-border py-10">
      <div className="relative overflow-hidden rounded-(--radius-panel) bg-surface box-border">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-muted/20 via-transparent to-primary-muted/10" />

        <div className="relative flex flex-col gap-6 px-10 py-9">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="group relative cursor-pointer" onClick={handleProfileImageClick}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
                <div className="rounded-full p-[2px] bg-gradient-to-br from-gold-light to-primary">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.nickname}
                      className="h-[72px] w-[72px] rounded-full object-cover border-[3px] border-surface"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface border-[3px] border-surface text-2xl font-bold text-gold-light">
                      {user?.nickname?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <FiCamera size={20} className="text-white" />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <h1 className="m-0 text-[22px] font-bold tracking-tight text-white">{user?.nickname}</h1>
                <span className="text-[14px] text-neutral-500">{user?.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLogoutPending}
              className="flex items-center gap-2 rounded-lg bg-white/[0.06] border-none px-4 py-2 text-[13px] font-medium text-neutral-300 cursor-pointer hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              <FiLogOut size={14} />
              {isLogoutPending ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/wallet')}
              className="flex flex-col justify-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-5 py-4 cursor-pointer hover:border-gold-light/30 transition-colors text-left min-w-0 overflow-hidden"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FaWallet size={14} className="shrink-0 text-gold-light" />
                <span className="text-[13px] font-bold text-neutral-300">보유머니</span>
              </div>
              <span className="text-[17px] font-bold text-gold-light truncate w-full">
                {formatPrice(walletData?.balance)}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('shipping');
                setSearchParams({ tab: 'shipping' });
                if (!defaultAddress) setAutoOpenAddressModal(true);
              }}
              className="flex flex-col justify-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-5 py-4 cursor-pointer hover:border-gold-light/30 transition-colors text-left min-w-0 overflow-hidden"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FaMapMarkerAlt size={14} className="shrink-0 text-gold-light" />
                <span className="text-[13px] font-bold text-neutral-300 truncate">
                  기본 배송지{defaultAddress ? ` · ${defaultAddress.addressName}` : ''}
                </span>
              </div>
              {defaultAddress ? (
                <span className="text-[13px] text-gold-light truncate w-full">
                  {defaultAddress.address} {defaultAddress.addressDetail}
                </span>
              ) : (
                <span className="text-[13px] text-gold-light/70">배송지를 등록해주세요</span>
              )}
            </button>

            {user?.sellerId ? (
              <button
                onClick={() => navigate(`/profile/${user.sellerId}`)}
                className="flex flex-col justify-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-5 py-4 cursor-pointer hover:border-gold-light/30 transition-colors text-left min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <FaStore size={14} className="shrink-0 text-gold-light" />
                  <span className="text-[13px] font-bold text-neutral-300">내 상점</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-bold text-gold-light truncate">상점 바로가기</span>
                  <FiChevronRight size={14} className="shrink-0 text-neutral-600" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => navigate('/seller/register')}
                className="flex flex-col justify-center gap-1 rounded-xl bg-white/[0.02] border border-dashed border-gold-light/20 px-5 py-4 min-w-0 overflow-hidden cursor-pointer hover:border-gold-light/40 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <FaStore size={14} className="shrink-0 text-neutral-500" />
                  <span className="text-[13px] font-bold text-neutral-400">내 상점</span>
                </div>
                <span className="text-[13px] text-gold-light/70">판매자로 등록하기</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-10">
        <nav className="sticky top-16 h-fit shrink-0 w-[240px] flex flex-col gap-1.5">
          {sidebarItems.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const nextTab = item.id as SettingsTab;
                  setActiveTab(nextTab);
                  setSearchParams({ tab: nextTab });
                }}
                className={`group relative flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-white/[0.06] border-gold-light/20 shadow-[0_0_0_1px_rgba(232,179,106,0.08)]'
                    : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="settingsNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-gold-light"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gold-light/10 text-gold-light'
                      : 'bg-white/[0.04] text-neutral-500 group-hover:text-neutral-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`flex-1 text-[14px] leading-none transition-colors ${
                    isActive
                      ? 'font-bold text-gold-light'
                      : 'font-medium text-neutral-400 group-hover:text-neutral-200'
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && <span className="ml-auto">{item.badge}</span>}
                {isActive && (
                  <svg className="shrink-0 w-4 h-4 text-gold-light/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>

        <div className="w-full flex flex-1 flex-col gap-6">
          {activeTab === 'order' && <OrderHistorySection />}
          {activeTab === 'stores' && <FollowedStoresSection />}
          {activeTab === 'shipping' && (
            <ShippingSection autoOpenModal={autoOpenAddressModal} />
          )}
          {activeTab === 'payment' && <PaymentSection />}
          {activeTab === 'account' && <AccountSection />}
        </div>
      </div>
    </div>
  );
}
