package com.ssafy.be.domain.uniqueaction.dto.response;

import lombok.Builder;

@Builder
public record UniqueBidStartResponse(
        BidRangeDto bidRange,
        TimerDto timer
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
