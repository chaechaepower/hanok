import { FaUser } from 'react-icons/fa';
import { GoBellFill } from 'react-icons/go';
import { IoMdSettings } from 'react-icons/io';
import { TbCircleLetterMFilled } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

import Logo from '@/assets/Logo.png';
import SearchBar from '../SearchBar';

export default function Header() {
  const navigate = useNavigate();

  return (
    <>
      <header className="w-full border-b border-white/10 ">
        <div className="mx-auto flex h-20 w-full items-center justify-between px-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-27 w-23 items-center justify-center"
              aria-label="홈으로 이동"
            >
              <img src={Logo} alt="Logo" className="h-full w-full object-contain" />
            </button>

            <button
              type="button"
              className="ml-8 h-10 rounded-full bg-[#F1EFE8] px-7 text-[15px] font-medium text-[#111827] transition hover:bg-white"
            >
              판매자 센터
            </button>
          </div>

          <SearchBar />

          <div className="flex items-center gap-4">
            <HeaderIcon onClick={() => navigate('/wallet')} ariaLabel="가상머니 페이지로 이동" tooltip="가상머니">
              <TbCircleLetterMFilled className="h-5.5 w-5.5 fill-current stroke-none" />
            </HeaderIcon>
            <HeaderIcon onClick={() => {}} ariaLabel="알림 모달 열기" tooltip="알림">
              <GoBellFill className="h-4.5 w-4.5" />
            </HeaderIcon>
            <HeaderIcon onClick={() => navigate('/settings')} ariaLabel="설정 페이지로 이동" tooltip="설정">
              <IoMdSettings className="h-4.5 w-4.5" />
            </HeaderIcon>
            <HeaderIcon onClick={() => navigate('/my')} ariaLabel="마이페이지로 이동" tooltip="마이페이지">
              <FaUser className="h-4.5 w-4.5" />
            </HeaderIcon>
          </div>
        </div>
      </header>
    </>
  );
}

type HeaderIconProps = {
  children: React.ReactNode;
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
        className="flex h-9 w-9 items-center justify-center rounded-full bg-point text-background transition hover:bg-white"
      >
        {children}
      </button>
      <span className="pointer-events-none absolute top-full z-10 mt-2 whitespace-nowrap rounded-md bg-[#111827] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {tooltip}
      </span>
    </div>
  );
}
