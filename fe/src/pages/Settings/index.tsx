import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaHeart, FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa';
import { useToast } from '@/components/common/Toast';
import { useGetMe } from '@/api/hooks/useGetMe';
import { useGetNotification } from '@/api/hooks/useGetNotification';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import { useLogout } from '@/api/hooks/usePostLogout';
import AccountSection from '@/components/Settings/AccountSection';
import FollowedStoresSection from '@/components/Settings/FollowedStoresSection';
import ShippingSection from '@/components/Settings/ShippingSection';
import PaymentSection from '@/components/Settings/PaymentSection';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

  const { data: meData, isLoading: isMeLoading } = useGetMe();
  const { isLoading: isNotiLoading } = useGetNotification();
  const { data: walletData, isLoading: isWalletLoading } = useGetWallet();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
      onError: (error) => {
        console.error('Logout failed:', error);
        showToast({ message: '로그아웃에 실패했습니다.' });
      },
    });
  };

  const formatPrice = (price?: number) => (price || 0).toLocaleString('ko-KR');

  if (isMeLoading || isNotiLoading || isWalletLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
        <p className="text-[#aaa] mt-3">정보를 불러오는 중…</p>
      </div>
    );
  }

  const user = meData;

  const tabs = [
    { id: 'account', label: '계정 관리', icon: <FaUserAlt size={20} className="text-[#3b82f6]" /> },
    { id: 'stores', label: '팔로우한 스토어', icon: <FaHeart size={20} className="text-[#ec4899]" /> },
    { id: 'shipping', label: '배송지 관리', icon: <FaMapMarkerAlt size={20} className="text-[#eab308]" /> },
    { id: 'payment', label: '결제수단 관리', icon: <FaCreditCard size={20} className="text-[#3b82f6]" /> },
  ];

  return (
    <div className="w-full box-border max-w-[1200px] mx-auto py-10 px-5 flex flex-col gap-8">
      <div className="w-full box-border border border-[#2e2e40] rounded-2xl py-8 px-10 bg-[#0c0c14] flex items-center justify-between">
        <div className="flex items-center gap-6">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.nickname}
              className="w-[100px] h-[100px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[100px] h-[100px] rounded-full bg-[#1e1e2d] text-[#d9b36d] text-4xl flex items-center justify-center font-bold">
              {user?.nickname?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-3xl font-bold text-white tracking-tight">{user?.nickname}</h1>
            <div className="flex items-center gap-3">
              <span className="text-lg text-[#aaa]">({user?.email?.split('@')[0]})</span>
              <button
                onClick={handleLogout}
                disabled={isLogoutPending}
                className="px-3 py-1 bg-transparent border border-[#555] text-[#aaa] text-sm rounded-md hover:bg-[#2e2e40] hover:text-white transition-colors"
              >
                {isLogoutPending ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/wallet')}
          className="flex items-center justify-between border border-[#2e2e40] bg-[#1a1a24] rounded-xl py-5 px-8 min-w-[320px] cursor-pointer hover:bg-[#20202c] transition-colors"
        >
          <span className="text-[#aaa] text-[17px] font-medium">보유머니</span>
          <div className="flex items-center gap-3">
            <span className="text-[#d9b36d] text-2xl font-bold">
              {formatPrice(walletData?.balance)} <span className="text-xl">원</span>
            </span>
            <span className="text-[#d9b36d] text-xl font-bold">&gt;</span>
          </div>
        </button>
      </div>

      <div className="flex gap-10 mt-2">
        <div className="w-[240px] flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center justify-between w-full py-4 text-left border-none bg-transparent cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {tab.icon}
                <span className={`text-[17px] font-medium ${activeTab === tab.id ? 'text-white' : 'text-[#888]'}`}>
                  {tab.label}
                </span>
              </div>
              {activeTab === tab.id && <div className="w-[4px] h-[20px] bg-[#d9b36d] rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-6">
          {activeTab === 'account' && <AccountSection />}
          {activeTab === 'stores' && <FollowedStoresSection />}
          {activeTab === 'shipping' && <ShippingSection />}
          {activeTab === 'payment' && <PaymentSection />}
          {activeTab !== 'account' && activeTab !== 'stores' && activeTab !== 'shipping' && activeTab !== 'payment' && (
            <div className="flex items-center justify-center p-20 text-[#888]">해당 메뉴는 준비 중입니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
