import type { ReactNode } from 'react';

export type ApiResponse<T> = {
  status: string;
  message: string;
  data: T;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  hasNext: boolean;
};

export type SideBarItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};
