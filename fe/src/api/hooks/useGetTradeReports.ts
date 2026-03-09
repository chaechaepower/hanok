import { useQuery } from '@tanstack/react-query';

import { getFetchInstance } from '../instance';
import type { ApiResponse, TradeReportItem, TradeReportType } from '@/types';

export const getTradeReportsPath = () => '/v1/trade/reports';

export const getTradeReports = async (type: TradeReportType) => {
  const response = await getFetchInstance().get<ApiResponse<TradeReportItem[]>>(getTradeReportsPath(), {
    params: { type },
  });

  return response.data.data;
};

export const useGetTradeReports = (type: TradeReportType, enabled = true) => {
  return useQuery({
    queryKey: ['tradeReports', type],
    queryFn: () => getTradeReports(type),
    enabled,
  });
};
