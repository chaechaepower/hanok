import type { SideBarItem } from '@/types';
import { useState } from 'react';

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
  const [internalActiveItemId, setInternalActiveItemId] = useState<string>(defaultActiveItemId ?? items[0]?.id ?? '');

  const uncontrolledActiveItemId = items.some((item) => item.id === internalActiveItemId)
    ? internalActiveItemId
    : defaultActiveItemId && items.some((item) => item.id === defaultActiveItemId)
      ? defaultActiveItemId
      : (items[0]?.id ?? '');

  const selectedItemId = activeItemId ?? uncontrolledActiveItemId;
  const containerClassName = `w-full max-w-[320px] px-5 py-6 ${className}`.trim();

  const handleItemClick = (item: SideBarItem) => {
    if (activeItemId === undefined) {
      setInternalActiveItemId(item.id);
    }
    onItemClick?.(item);
  };

  return (
    <aside className={containerClassName}>
      <ul className="flex flex-col gap-0.8">
        {items.map((item) => {
          const isActive = item.id === selectedItemId;
          return (
            <li key={item.id} className="relative">
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition ${
                  isActive ? 'bg-white/5 text-[#F5F2EB]' : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center text-[24px] leading-none">
                  {item.icon ?? item.label.slice(0, 1)}
                </span>
                <span className={`whitespace-nowrap text-[16px] leading-none ${isActive ? 'font-bold' : 'font-light'}`}>
                  {item.label}
                </span>
              </button>
              {isActive && (
                <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[#F5F2EB]" />
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
