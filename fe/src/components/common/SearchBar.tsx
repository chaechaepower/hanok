import { useState } from 'react';
import type { ChangeEventHandler, FormEvent } from 'react';
import { IoSearchOutline } from 'react-icons/io5';

type SearchBarProps = {
  placeholder?: string;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSearch?: (keyword: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  maxLength?: number;
};

export default function SearchBar({
  placeholder = '검색어를 입력하세요',
  className = '',
  value,
  defaultValue = '',
  onChange,
  onSearch,
  autoFocus = false,
  disabled = false,
  maxLength,
}: SearchBarProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value ?? '' : internalValue;
  const combinedClassName =
    `group relative flex h-10 w-full max-w-[520px] items-center ${className}`.trim();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!isControlled) {
      setInternalValue(event.target.value);
    }

    onChange?.(event);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(currentValue.trim());
  };

  return (
    <form className={combinedClassName} onSubmit={handleSubmit}>
      <input
        type="text"
        value={currentValue}
        placeholder={placeholder}
        onChange={handleChange}
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={maxLength}
        className="peer h-full w-full rounded-xl border border-warm/6 bg-warm/3 pl-4 pr-11 text-body-md text-neutral-100 placeholder:text-neutral-600 outline-none transition-all duration-250 focus:border-primary/40 focus:bg-warm/5 focus:shadow-primary-glow disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        aria-label="Search"
        disabled={disabled}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 transition-colors duration-200 hover:text-primary disabled:cursor-not-allowed"
      >
        <IoSearchOutline className="h-[18px] w-[18px] transition-colors duration-200 peer-focus:text-primary" />
      </button>
    </form>
  );
}
