import { useCallback, useState } from 'react';

import { useSearchJuso } from '@/api/hooks/useSearchJuso';
import type { JusoResult } from '@/types';

import { ADDRESS_SEARCH_COUNT_PER_PAGE } from '@/constants/addressForm';

export default function useAddressSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<JusoResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { mutateAsync: searchJuso, isPending: searchLoading } = useSearchJuso();

  const openAddressSearch = useCallback(() => {
    setSearchKeyword('');
    setSearchResults([]);
    setSearchError('');
    setCurrentPage(1);
    setTotalCount(0);
    setIsOpen(true);
  }, []);

  const closeAddressSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetAddressSearch = useCallback(() => {
    setIsOpen(false);
    setSearchKeyword('');
    setSearchResults([]);
    setSearchError('');
    setCurrentPage(1);
    setTotalCount(0);
  }, []);

  const searchAddress = useCallback(
    async (page: number = 1) => {
      try {
        setSearchError('');
        const response = await searchJuso({
          keyword: searchKeyword,
          currentPage: page,
          countPerPage: ADDRESS_SEARCH_COUNT_PER_PAGE,
        });

        setSearchResults(response.results);
        setTotalCount(response.totalCount);
        setCurrentPage(page);
      } catch (error) {
        setSearchResults([]);
        setTotalCount(0);
        setSearchError(error instanceof Error ? error.message : '주소 검색 중 오류가 발생했습니다.');
      }
    },
    [searchJuso, searchKeyword],
  );

  return {
    addressSearchOpen: isOpen,
    searchKeyword,
    searchResults,
    searchLoading,
    searchError,
    currentPage,
    totalCount,
    countPerPage: ADDRESS_SEARCH_COUNT_PER_PAGE,
    setSearchKeyword,
    openAddressSearch,
    closeAddressSearch,
    resetAddressSearch,
    searchAddress,
  };
}
