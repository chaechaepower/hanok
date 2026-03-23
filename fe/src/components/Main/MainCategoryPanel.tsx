import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LayoutGrid } from 'lucide-react';

import type { SideBarItem } from '@/types';

import { MAIN_CATEGORY_ITEMS } from './mainCategoryItems';

type MainCategoryPanelProps = {
  activeItemId: string;
  onItemClick: (item: SideBarItem) => void;
};

export default function MainCategoryPanel({ activeItemId, onItemClick }: MainCategoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAllClick = () => {
    onItemClick(MAIN_CATEGORY_ITEMS[0]);
    setIsExpanded((prev) => !prev);
  };

  const handleCategoryClick = (item: SideBarItem) => {
    onItemClick(item);
    setIsExpanded(true);
  };

  return (
    <div className="rounded-[28px] border border-primary-dark/30 bg-surface p-3">
      <button
        type="button"
        onClick={handleAllClick}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-2 text-left transition 
          text-neutral-200 hover:bg-surface-elevated"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-muted text-point">
            <LayoutGrid size={18} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold leading-none">전체</span>
          </span>
        </span>
        <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-1.5 border-t border-primary-dark/20 pt-3">
              {MAIN_CATEGORY_ITEMS.filter((item) => item.id !== 'ALL').map((item) => {
                const isActive = item.id === activeItemId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCategoryClick(item)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      isActive
                        ? 'bg-point/15 text-point'
                        : 'text-neutral-400 hover:bg-surface-elevated hover:text-neutral-100'
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-muted/70">
                      {item.icon}
                    </span>
                    <span className="truncate text-[14px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
