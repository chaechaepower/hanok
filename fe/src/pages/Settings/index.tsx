import { useRef, useState } from 'react';
import { FaStore } from 'react-icons/fa';
import { FiCamera } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useGetMe } from '@/api/hooks/useGetMe';
import { useGetNotification } from '@/api/hooks/useGetNotification';
import { useLogout as useLogout } from '@/api/hooks/usePostLogout';
import { usePatchProfileImage } from '@/api/hooks/usePatchProfileImage';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import SideBar from '@/components/common/layouts/SideBar';
import { settingsSidebarItems } from '@/components/common/layouts/settingsSidebarItems';
import { useToast } from '@/components/common/Toast';
import AccountSection from '@/components/Settings/AccountSection';
import FollowedStoresSection from '@/components/Settings/FollowedStoresSection';
import OrderHistorySection from '@/components/Settings/OrderHistorySection';
import PaymentSection from '@/components/Settings/PaymentSection';
import ShippingSection from '@/components/Settings/ShippingSection';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';

type SettingsTab = 'account' | 'stores' | 'shipping' | 'payment' | 'order';
const SETTINGS_TABS: SettingsTab[] = ['account', 'stores', 'shipping', 'payment', 'order'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = SETTINGS_TABS.includes(tabParam as SettingsTab) ? (tabParam as SettingsTab) : 'order';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const { data: meData, isLoading: isMeLoading } = useGetMe();
  const { isLoading: isNotiLoading } = useGetNotification();
  const { data: walletData, isLoading: isWalletLoading } = useGetWallet();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const { mutate: patchProfileImage } = usePatchProfileImage();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    patchProfileImage(file, {
      onSuccess: () => {
        showToast({ message: '프로필 이미지가 변경되었습니다.' });
      },
      onError: (error) => {
        showToast({ message: getUploadErrorMessage(error, '프로필 이미지 변경에 실패했습니다.') });
      },
    });
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
      onError: () => {
        showToast({ message: '로그아웃에 실패했습니다.' });
      },
    });
  };

  const formatPrice = (price?: number) => (price || 0).toLocaleString('ko-KR');

  if (isMeLoading || isNotiLoading || isWalletLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-gold-light" />
        <p className="mt-3 text-neutral-400">정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  const user = meData;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 box-border py-10">
      <div className="flex w-full items-center justify-between rounded-2xl bg-surface-elevated px-10 py-8 box-border">
        <div className="flex items-center gap-6">
          <div className="group relative cursor-pointer" onClick={handleProfileImageClick}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.nickname}
                className="h-[100px] w-[100px] rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-surface text-4xl font-bold text-gold-light">
                {user?.nickname?.charAt(0) || 'U'}
              </div>
            )}
            <div className="absolute inset-0 flex h-[100px] w-[100px] items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <FiCamera size={24} className="text-white" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-3xl font-bold tracking-tight text-white">{user?.nickname}</h1>
            <div className="flex items-center gap-3">
              <span className="text-lg text-neutral-400">({user?.email?.split('@')[0]})</span>
              <button onClick={handleLogout} disabled={isLogoutPending} className="btn btn-primary-outline">
                {isLogoutPending ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {user?.sellerId && (
            <button
              onClick={() => navigate(`/profile/${user.sellerId}`)}
              className="flex min-w-[320px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-surface-elevated px-8 py-4 transition-colors hover:bg-surface"
            >
              <FaStore className="text-gold-light" size={18} />
              <span className="text-[17px] font-bold text-gold-light">내 상점 보기</span>
            </button>
          )}

          <button
            onClick={() => navigate('/wallet')}
            className="flex min-w-[320px] cursor-pointer items-center justify-between rounded-xl bg-surface-elevated px-8 py-5 transition-colors hover:bg-surface"
          >
            <span className="text-[17px] font-medium text-neutral-400">보유머니</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gold-light">
                {formatPrice(walletData?.balance)} <span className="text-xl">원</span>
              </span>
              <span className="text-xl font-bold text-gold-light">&gt;</span>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-2 flex gap-10">
        <SideBar
          items={settingsSidebarItems}
          activeItemId={activeTab}
          onItemClick={(item) => {
            const nextTab = item.id as SettingsTab;
            setActiveTab(nextTab);
            setSearchParams({ tab: nextTab });
          }}
          className="static shrink-0 !w-[240px] border-r-0 !bg-transparent !py-0"
        />

        <div className="w-full flex flex-1 flex-col gap-6">
          {activeTab === 'order' && <OrderHistorySection />}
          {activeTab === 'stores' && <FollowedStoresSection />}
          {activeTab === 'shipping' && <ShippingSection />}
          {activeTab === 'payment' && <PaymentSection />}
          {activeTab === 'account' && <AccountSection />}
        </div>
      </div>
    </div>
  );
}
