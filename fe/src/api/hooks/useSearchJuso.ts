import { useMutation } from '@tanstack/react-query';

import type { JusoResult } from '@/types';

const JUSO_API_KEY = import.meta.env.VITE_JUSO_API_KEY as string;

type SearchJusoParams = {
  keyword: string;
  currentPage?: number;
  countPerPage?: number;
};

type SearchJusoResponse = {
  results: JusoResult[];
  totalCount: number;
};

export const searchJusoAddress = async ({
  keyword,
  currentPage = 1,
  countPerPage = 10,
}: SearchJusoParams): Promise<SearchJusoResponse> => {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    throw new Error('검색할 주소를 입력해주세요.');
  }

  const params = new URLSearchParams({
    confmKey: JUSO_API_KEY,
    currentPage: String(currentPage),
    countPerPage: String(countPerPage),
    keyword: trimmedKeyword,
    resultType: 'json',
  });

  const response = await fetch(`https://business.juso.go.kr/addrlink/addrLinkApi.do?${params.toString()}`);
  const data = await response.json();
  const result = data.results;

  if (result.common.errorCode !== '0') {
    throw new Error(result.common.errorMessage || '주소 검색 중 오류가 발생했습니다.');
  }

  return {
    results: result.juso ?? [],
    totalCount: Number(result.common.totalCount),
  };
};

export const useSearchJuso = () =>
  useMutation({
    mutationFn: searchJusoAddress,
  });
