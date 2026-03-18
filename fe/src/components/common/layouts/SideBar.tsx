import type { SideBarItem } from '@/types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
type SideBarProps = {
  items: SideBarItem[];
  activeItemId?: string;
  defaultActiveItemId?: string;
  onItemClick?: (item: SideBarItem) => void;
  className?: string;
};

export default function SideBar({
  items,
  activeItemId,
  defaultActiveItemId,
  onItemClick,
  className = '',
}: SideBarProps) {
  const navigate = useNavigate();
  const [internalActiveItemId, setInternalActiveItemId] = useState<string>(defaultActiveItemId ?? items[0]?.id ?? '');

  const uncontrolledActiveItemId = items.some((item) => item.id === internalActiveItemId)
    ? internalActiveItemId
    : defaultActiveItemId && items.some((item) => item.id === defaultActiveItemId)
      ? defaultActiveItemId
      : (items[0]?.id ?? '');

  const selectedItemId = activeItemId ?? uncontrolledActiveItemId;

  const handleItemClick = (item: SideBarItem) => {
    if (activeItemId === undefined) {
      setInternalActiveItemId(item.id);
    }
    onItemClick?.(item);
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside
      className={`w-[280px] sticky top-16 h-[calc(100vh-64px)] bg-background flex flex-col py-6 border-r border-neutral-800 ${className}`.trim()}
    >
      {/* 카테고리 리스트 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = item.id === selectedItemId;
            return (
              <li key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="relative flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition"
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebarActive"
                      initial={false}
                      className="absolute inset-0 rounded-xl bg-white/5"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-6 w-6 items-center justify-center text-[20px] leading-none ${isActive ? 'text-point' : 'text-neutral-500'}`}
                  >
                    {item.icon ?? item.label.slice(0, 1)}
                  </span>
                  <span
                    className={`relative z-10 whitespace-nowrap text-[15px] leading-none ${isActive ? 'font-bold text-point' : 'font-medium text-neutral-400 hover:text-neutral-200'}`}
                  >
                    {item.label}
                  </span>
                </button>
                {isActive && (
                  <motion.span
                    layoutId="sidebarIndicator"
                    initial={false}
                    className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-point"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
