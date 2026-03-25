import { useEffect, useRef, useState } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';

type SortDropdownOption = {
  value: string;
  label: string;
};

type Props = {
  options: SortDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  selectedLabel?: string;
  buttonClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
  unselectedOptionClassName?: string;
};

export default function SortDropdown({
  options,
  value,
  onChange,
  selectedLabel,
  buttonClassName = '',
  labelClassName = '',
  iconClassName = '',
  menuClassName = '',
  optionClassName = '',
  selectedOptionClassName = '',
  unselectedOptionClassName = '',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!dropdownRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const resolvedSelectedLabel = selectedLabel ?? options.find((option) => option.value === value)?.label ?? '';

  const buttonClasses = [
    'inline-flex items-center justify-center gap-2 rounded-(--radius-control) transition',
    buttonClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const menuClasses = [
    'absolute right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-(--radius-control) p-1',
    menuClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={dropdownRef} className="relative">
      <button type="button" onClick={() => setIsOpen((prev) => !prev)} className={buttonClasses}>
        <span className={labelClassName}>{resolvedSelectedLabel}</span>
        <span className={[iconClassName, isOpen ? 'rotate-180' : ''].filter(Boolean).join(' ')}>
          <MdKeyboardArrowDown />
        </span>
      </button>

      {isOpen && (
        <div className={menuClasses}>
          {options.map((option) => {
            const isSelected = value === option.value;
            const stateClassName = isSelected ? selectedOptionClassName : unselectedOptionClassName;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={[optionClassName, stateClassName].filter(Boolean).join(' ')}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
