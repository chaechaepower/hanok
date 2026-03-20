package com.ssafy.be.domain.seller.dto.response;

import java.util.List;

public record SellerReportResponse(
        Long totalSalesAmount,
        Long totalSettlementAmount,
        EscrowSummaryDto escrowSummary,
        TrendGraphDto trendGraph,
        List<TopHotItemDto> topHotItems,
        AuctionStatsDto auctionStats,
        TransactionStatsDto transactionStats,
        List<CategoryStatsDto> categoryStats,
        ReputationDto reputation
) {
    public record EscrowSummaryDto(
            Long pendingSettlementAmount,
            Long completedSettlementAmount
    ) {}

    public record TrendGraphDto(
            Long currentMonthTotal,
            Long lastMonthTotal,
            Double growthRate,
            List<DailySalesDto> dailySales
    ) {}

    public record DailySalesDto(
            String date,
            Long amount
    ) {}

    public record TopHotItemDto(
            Long itemId,
            String itemName,
            String imageUrl,
            Long bidCount,
            Long finalPrice
    ) {}

    public record AuctionStatsDto(
            long totalAuctions,
            long successfulBids,
            long failedBids
    ) {}

    public record TransactionStatsDto(
            long completedTrades,
            long cancelledTrades,
            double completionRate
    ) {}

    public record CategoryStatsDto(
            String categoryName,
            long salesCount,
            long salesAmount
    ) {}

    public record ReputationDto(
            double rating,
            Double avgShipDays,
            Integer penaltyCount
    ) {}
}
