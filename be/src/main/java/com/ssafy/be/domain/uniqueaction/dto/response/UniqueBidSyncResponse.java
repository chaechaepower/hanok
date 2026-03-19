package com.ssafy.be.domain.uniqueaction.dto.response;

import lombok.Builder;

@Builder
public record UniqueBidSyncResponse(
        BidRangeDto bidRange,
        TimerDto timer,
        long participantCount,
        boolean hasBid
) {
    @Builder
    public record BidRangeDto(
            Long minPrice,
            Long maxPrice,
            Long bidUnit
    ) {}

    @Builder
    public record TimerDto(
            int durationSeconds,
            String serverNow,
            String serverStartedAt
    ) {}
}
