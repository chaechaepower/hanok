import { GoBellFill } from 'react-icons/go';
import { IoMdSettings } from 'react-icons/io';
import { FaUser } from 'react-icons/fa';
import { TbCircleLetterMFilled } from 'react-icons/tb';
import Logo from '@/assets/Logo.png';
import SearchBar from '../SearchBar';

export default function Header() {
  return (
    <header className="w-full border-b border-white/10 bg-[#020613]">
      <div className="mx-auto flex h-27 w-full items-center justify-between px-8 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center">
          <div className="flex h-27 w-23 items-center justify-center">
            <img src={Logo} alt="Logo" className="h-full w-full object-contain" />
          </div>

          <button
            type="button"
            className="ml-8 h-10 rounded-full bg-[#F1EFE8] px-7 text-[15px] font-medium text-[#111827] transition hover:bg-white"
          >
            판매자 센터
          </button>
        </div>

        <SearchBar />

        <div className="flex items-center gap-4">
          <HeaderIcon>
            <TbCircleLetterMFilled className="h-5.5 w-5.5 fill-current stroke-none" />
          </HeaderIcon>
          <HeaderIcon>
            <GoBellFill className="h-4.5 w-4.5" />
          </HeaderIcon>
          <HeaderIcon>
            <IoMdSettings className="h-4.5 w-4.5" />
          </HeaderIcon>
          <HeaderIcon>
            <FaUser className="h-4.5 w-4.5" />
          </HeaderIcon>
        </div>
      </div>
    </header>
  );
}

function HeaderIcon({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F2EB] text-[#111827] transition hover:bg-white"
    >
      {children}
    </button>
  );
}
