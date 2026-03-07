import { IoSearchOutline } from 'react-icons/io5';

type SearchBarProps = {
  placeholder?: string;
  className?: string;
};

export default function SearchBar({ placeholder = '검색어를 입력하세요', className = '' }: SearchBarProps) {
  const combinedClassName =
    `flex h-9.5 w-full max-w-200 items-center rounded-full border border-[#D9D4C7] bg-transparent px-5 transition-colors focus-within:border-point ${className}`.trim();

  return (
    <div className={combinedClassName}>
      <IoSearchOutline className="mr-3 h-4.5 w-4.5 text-[#D9D4C7]" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] text-white placeholder:text-[#8B8F98] focus:outline-none"
      />
    </div>
  );
}
