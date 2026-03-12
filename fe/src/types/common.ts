import type { ReactNode } from 'react';

export type ApiResponse<T> = {
  status: string;
  message: string;
  data: T;
};

export type PageResponse<T> = {
  totalElements: number;
  totalPages: number;
  pageable: {
    pageNumber: number;
    paged: boolean;
    pageSize: number;
    unpaged: boolean;
    offset: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  numberOfElements: number;
  size: number;
  content: T[];
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type SideBarItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  path?: string;
};
