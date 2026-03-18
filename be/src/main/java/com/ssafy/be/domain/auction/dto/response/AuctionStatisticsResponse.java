package com.ssafy.be.domain.auction.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record AuctionStatisticsResponse(
        String itemName,
        int bidCount,
        Long startPrice,
        Long currentPrice,
        List<RecentBidDto> recentBids
) {
    public record RecentBidDto(
            Long userId,
            String nickname,
            Long amount,
            LocalDateTime placedAt
    ){}
}
