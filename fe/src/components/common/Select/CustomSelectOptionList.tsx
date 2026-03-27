import type { CustomSelectOption } from '@/types';

type CustomSelectOptionListProps = {
  options: CustomSelectOption[];
  value: string;
  onOptionHover: (option: CustomSelectOption | null) => void;
  onSelect: (optionValue: string) => void;
};

export default function CustomSelectOptionList({
  options,
  value,
  onOptionHover,
  onSelect,
}: CustomSelectOptionListProps) {
  return (
    <div className="scrollbar-hide max-h-[240px] overflow-y-auto">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onMouseEnter={() => onOptionHover(option)}
          onMouseLeave={() => onOptionHover(null)}
          onClick={() => onSelect(option.value)}
          className={`w-full px-4 py-2.5 text-left text-[14px] transition-colors whitespace-nowrap ${
            value === option.value
              ? 'bg-gold/15 font-semibold text-gold-light'
              : 'text-neutral-300 hover:bg-warm/8 hover:text-neutral-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
