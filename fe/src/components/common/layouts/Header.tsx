import { useNavigate } from 'react-router-dom';
import { GoBellFill } from 'react-icons/go';
import { IoMdSettings } from 'react-icons/io';
import { FaUser } from 'react-icons/fa';
import { TbCircleLetterMFilled } from 'react-icons/tb';
import Logo from '@/assets/Logo.png';
import SearchBar from '../SearchBar';

export default function Header() {
  const navigate = useNavigate();

  return (
    <>
      <header className="w-full border-b border-white/10 bg-[#020613]">
        <div className="mx-auto flex h-27 w-full items-center justify-between px-8 sm:px-10 lg:px-14 xl:px-20">
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
            <HeaderIcon onClick={() => navigate('/wallet')} ariaLabel="지갑 페이지로 이동">
              <TbCircleLetterMFilled className="h-5.5 w-5.5 fill-current stroke-none" />
            </HeaderIcon>
            <HeaderIcon onClick={() => {}} ariaLabel="알림 모달 열기">
              <GoBellFill className="h-4.5 w-4.5" />
            </HeaderIcon>
            <HeaderIcon onClick={() => navigate('/settings')} ariaLabel="설정 페이지로 이동">
              <IoMdSettings className="h-4.5 w-4.5" />
            </HeaderIcon>
            <HeaderIcon onClick={() => navigate('/my')} ariaLabel="마이페이지로 이동">
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
};

function HeaderIcon({ children, onClick, ariaLabel }: HeaderIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F2EB] text-[#111827] transition hover:bg-white"
    >
      {children}
    </button>
  );
}
