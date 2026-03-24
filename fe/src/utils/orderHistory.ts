import type { EscrowItem } from '@/types';

import type { EscrowStatusFilter } from '@/utils/getEscrowStateUI';

export type SortOption = 'LATEST' | 'AMOUNT';

export const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'LATEST', label: '최신순' },
  { value: 'AMOUNT', label: '금액 높은순' },
];

export const getOrderHistorySummary = (items: EscrowItem[]) => {
  const activeItems = items.filter((item) => item.escrowStatus !== 'CANCELLED');

  return {
    totalCount: activeItems.length,
    totalAmount: activeItems.reduce((sum, item) => sum + item.amount, 0),
  };
};

export const getFilteredAndSortedEscrows = (
  items: EscrowItem[],
  statusFilter: EscrowStatusFilter,
  sortBy: SortOption,
) => {
  const filteredItems = statusFilter === 'ALL' ? items : items.filter((item) => item.escrowStatus === statusFilter);

  return sortBy === 'LATEST'
    ? [...filteredItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [...filteredItems].sort((a, b) => b.amount - a.amount);
};
