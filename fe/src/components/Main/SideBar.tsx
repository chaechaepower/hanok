import type { SellerRankingItem, SideBarItem } from '@/types';

import MainCategoryPanel from './MainCategoryPanel';
import SellerRankingPanel from './SellerRankingPanel';

type MainSideBarProps = {
  activeItemId: string;
  onItemClick: (item: SideBarItem) => void;
  rankingItems?: SellerRankingItem[];
  className?: string;
};

export default function MainSideBar({
  activeItemId,
  onItemClick,
  rankingItems = [],
  className = '',
}: MainSideBarProps) {
  return (
    <aside
      className={`relative z-20 flex w-full shrink-0 flex-col gap-5 pb-6 xl:sticky xl:top-16 xl:w-[280px] xl:border-r xl:border-white/5 xl:pr-4 ${className}`.trim()}
    >
      <MainCategoryPanel activeItemId={activeItemId} onItemClick={onItemClick} />
      <div className="relative z-30 shrink-0">
        <SellerRankingPanel rankingItems={rankingItems} />
      </div>
    </aside>
  );
}
