import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaHeart, FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa';
import { BiSolidPurchaseTag } from "react-icons/bi";
import { FiCamera } from 'react-icons/fi';
import { useToast } from '@/components/common/Toast';
import { useGetMe } from '@/api/hooks/useGetMe';
import { usePatchProfileImage } from '@/api/hooks/usePatchProfileImage';
import { useGetNotification } from '@/api/hooks/useGetNotification';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import { useLogout } from '@/api/hooks/usePostLogout';
import { FaStore } from 'react-icons/fa';
import AccountSection from '@/components/Settings/AccountSection';
import FollowedStoresSection from '@/components/Settings/FollowedStoresSection';
import ShippingSection from '@/components/Settings/ShippingSection';
import PaymentSection from '@/components/Settings/PaymentSection';
import OrderHistorySection from '@/components/Settings/OrderHistorySection';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

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

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    patchProfileImage(file, {
      onSuccess: () => {
        showToast({ message: '프로필 이미지가 변경되었습니다.' });
      },
      onError: () => {
        showToast({ message: '프로필 이미지 변경에 실패했습니다.' });
      },
    });
  };

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
    { id: 'order', label: '구매 내역', icon: <BiSolidPurchaseTag size={20} className="text-[#4ef63b]" /> },

  ];

  return (
    <div className="w-full box-border max-w-[1200px] mx-auto py-10 px-5 flex flex-col gap-8">
      <div className="w-full box-border rounded-2xl py-8 px-10 bg-[#050505] border border-[#d9b36d]/30 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div
            className="relative group cursor-pointer"
            onClick={handleProfileImageClick}
          >
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
                className="w-[100px] h-[100px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[100px] h-[100px] rounded-full bg-[#1e1e2d] text-[#d9b36d] text-4xl flex items-center justify-center font-bold">
                {user?.nickname?.charAt(0) || 'U'}
              </div>
            )}
            <div className="absolute inset-0 w-[100px] h-[100px] rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <FiCamera size={24} className="text-white" />
            </div>
          </div>
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

        <div className="flex flex-col gap-3">
          {user?.sellerId && (
            <button
              onClick={() => navigate(`/profile/${user.sellerId}`)}
              className="flex items-center justify-center gap-2 border border-[#d9b36d]/30 bg-[#050505] rounded-xl py-4 px-8 min-w-[320px] cursor-pointer hover:bg-[#111] transition-colors"
            >
              <FaStore className="text-[#d9b36d]" size={18} />
              <span className="text-[#d9b36d] text-[17px] font-bold">내 상점 보기</span>
            </button>
          )}
          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center justify-between border border-[#d9b36d]/30 bg-[#050505] rounded-xl py-5 px-8 min-w-[320px] cursor-pointer hover:bg-[#111] transition-colors"
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
          {activeTab === 'order' && <OrderHistorySection />}
          {activeTab !== 'account' && activeTab !== 'stores' && activeTab !== 'shipping' && activeTab !== 'payment' && (
            <div className="flex items-center justify-center p-20 text-[#888]">해당 메뉴는 준비 중입니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
