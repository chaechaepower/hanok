import { motion } from 'framer-motion';

import SortDropdown from '@/components/common/SortDropdown';
import { ESCROW_STATUS_OPTIONS, type EscrowStatusFilter } from '@/utils/getEscrowStateUI';

import { SORT_OPTIONS, type SortOption } from '../../../utils/orderHistory';

type Props = {
  statusFilter: EscrowStatusFilter;
  sortBy: SortOption;
  onChangeStatusFilter: (filter: EscrowStatusFilter) => void;
  onChangeSortBy: (sortBy: SortOption) => void;
};

export default function OrderHistoryToolbar({ statusFilter, sortBy, onChangeStatusFilter, onChangeSortBy }: Props) {
  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? '';

  return (
    <div className="flex items-center justify-between">
      <div className="relative inline-flex items-center rounded-xl bg-warm/6 p-1">
        {ESCROW_STATUS_OPTIONS.map((option) => {
          const isSelected = statusFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChangeStatusFilter(option.value)}
              className="relative z-10 rounded-lg px-4 py-2 text-subtitle-sm transition"
            >
              {isSelected && (
                <motion.span
                  layoutId="orderStatusTab"
                  initial={false}
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 ${isSelected ? 'text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <SortDropdown
        options={SORT_OPTIONS}
        value={sortBy}
        selectedLabel={selectedSortLabel}
        onChange={(value) => onChangeSortBy(value as SortOption)}
        buttonClassName="w-[120px] bg-primary/15 px-2 py-2 hover:bg-primary/25"
        labelClassName="text-body-md font-semibold text-primary-light"
        iconClassName="text-caption text-point/70 transition-transform"
        menuClassName="w-[110px] bg-primary/15 shadow-primary-glow backdrop-blur-md"
        optionClassName="flex w-full items-center justify-center whitespace-nowrap rounded-lg px-2 py-2 text-center text-body-md transition"
        selectedOptionClassName="bg-primary font-semibold text-neutral-100"
        unselectedOptionClassName="text-neutral-300 hover:bg-warm/10"
      />
    </div>
  );
}
