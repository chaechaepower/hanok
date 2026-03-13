import type { ReactNode } from 'react';
import { FaUser } from 'react-icons/fa';
import { GoBellFill } from 'react-icons/go';
import { IoMdSettings } from 'react-icons/io';
import { TbCircleLetterMFilled } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import Logo from '@/assets/Logo.png';
import SearchBar from '../SearchBar';
import Button from '../Button';

export default function Header() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: sellerStatus } = useGetSellerStatus(isLoggedIn);
  const sellerButtonLabel = sellerStatus?.isSeller ? '판매자 센터' : '판매자 등록';
  const sellerButtonPath = sellerStatus?.isSeller ? '/products' : '/seller/register';

  const handleSellerButtonClick = () => {
    navigate(isLoggedIn ? sellerButtonPath : '/login');
  };

  const handleProfileClick = () => {
    const userId = localStorage.getItem('userId');

    navigate(userId ? `/profile/${userId}` : '/login');
  };

  return (
    <header className="w-full border-b border-white/10 ">
      <div className="mx-auto flex h-20 w-full items-center justify-between px-8 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-32 w-32 items-center justify-center"
            aria-label="Go to home"
          >
            <img src={Logo} alt="Logo" className="h-full w-full object-contain" />
          </button>

          <Button onClick={handleSellerButtonClick} className="ml-8 h-10 px-2">
            {sellerButtonLabel}
          </Button>
        </div>

        <SearchBar />

        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <HeaderIcon onClick={() => navigate('/wallet')} ariaLabel="Go to wallet" tooltip="가상머니">
              <TbCircleLetterMFilled className="h-5.5 w-5.5 fill-current stroke-none" />
            </HeaderIcon>
            <HeaderIcon onClick={() => {}} ariaLabel="Open alerts" tooltip="알림">
              <GoBellFill className="h-4.5 w-4.5" />
            </HeaderIcon>
            <HeaderIcon onClick={() => navigate('/settings')} ariaLabel="Go to settings" tooltip="설정">
              <IoMdSettings className="h-4.5 w-4.5" />
            </HeaderIcon>
            <HeaderIcon onClick={handleProfileClick} ariaLabel="Go to profile" tooltip="프로필">
              <FaUser className="h-4.5 w-4.5" />
            </HeaderIcon>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/login')} className="px-5 py-2 transition">
              로그인
            </Button>
            <Button onClick={() => navigate('/signup')} className="px-5 py-2 transition">
              회원가입
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

type HeaderIconProps = {
  children: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  tooltip: string;
};

function HeaderIcon({ children, onClick, ariaLabel, tooltip }: HeaderIconProps) {
  return (
    <div className="group relative flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-point text-white transition hover:bg-white hover:text-background"
      >
        {children}
      </button>
      <span className="pointer-events-none absolute top-full z-10 mt-2 whitespace-nowrap rounded-md bg-[#111827] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {tooltip}
      </span>
    </div>
  );
}
