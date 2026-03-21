export type DailySales = {
  date: string;
  amount: number;
};

export type EscrowSummary = {
  pendingSettlementAmount: number;
  completedSettlementAmount: number;
};

export type TrendGraph = {
  currentMonthTotal: number;
  lastMonthTotal: number;
  growthRate: number;
  dailySales: DailySales[];
};

export type TopHotItem = {
  itemId: number;
  itemName: string;
  imageUrl: string;
  bidCount: number;
  finalPrice: number;
};

export type AuctionStats = {
  totalAuctions: number;
  successfulBids: number;
  failedBids: number;
};

export type TransactionStats = {
  completedTrades: number;
  cancelledTrades: number;
  completionRate: number;
};

export type CategoryStats = {
  category: string;
  salesCount: number;
  salesAmount: number;
};

export type ReputationSummary = {
  rating: number;
  avgShipDays: number;
  penaltyCount: number;
};

export type SellerReportData = {
  totalSalesAmount: number;
  totalSettlementAmount: number;
  escrowSummary: EscrowSummary;
  trendGraph: TrendGraph;
  topHotItems: TopHotItem[];
  auctionStats: AuctionStats;
  transactionStats: TransactionStats;
  categoryStats: CategoryStats[];
  reputation: ReputationSummary;
};
