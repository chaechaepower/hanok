import { useEffect, useRef, useState } from 'react';

import { MdKeyboardArrowDown } from 'react-icons/md';

import type { MainStreamSort } from '@/api/hooks/useGetMain';

type MainSortDropdownProps = {
  options: Array<{ value: MainStreamSort; label: string }>;
  selectedValue: MainStreamSort;
  selectedLabel: string;
  onSelect: (value: MainStreamSort) => void;
};

export default function MainSortDropdown({
  options,
  selectedValue,
  selectedLabel,
  onSelect,
}: MainSortDropdownProps) {
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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-primary-dark/30 bg-surface-elevated px-4 py-2 text-warm transition hover:bg-primary-muted/40"
      >
        <span className="text-sm font-semibold">{selectedLabel}</span>
        <span className={`text-caption text-warm/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <MdKeyboardArrowDown />
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-full overflow-hidden rounded-[14px] border border-primary-dark/30 bg-surface p-1">
          {options.map((option) => {
            const isSelected = selectedValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-sm transition ${
                  isSelected ? 'bg-primary-muted font-semibold text-warm' : 'text-neutral-300 hover:bg-surface-elevated'
                }`}
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
