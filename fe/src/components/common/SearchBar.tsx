import { IoSearchOutline } from 'react-icons/io5';

type SearchBarProps = {
  placeholder?: string;
  className?: string;
};

export default function SearchBar({ placeholder = '검색어를 입력하세요', className = '' }: SearchBarProps) {
  const combinedClassName =
    `group relative flex h-10 w-full max-w-[520px] items-center ${className}`.trim();

  return (
    <div className={combinedClassName}>
      <input
        type="text"
        placeholder={placeholder}
        className="peer h-full w-full rounded-xl border border-warm/6 bg-warm/3 pl-4 pr-11 text-body-md text-neutral-100 placeholder:text-neutral-600 outline-none transition-all duration-250 focus:bg-warm/5 focus:border-primary/40 focus:shadow-primary-glow"
      />
      <IoSearchOutline className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500 transition-colors duration-200 peer-focus:text-primary" />
    </div>
  );
}
