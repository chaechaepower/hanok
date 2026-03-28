package com.ssafy.be.domain.bottomupauction.dto.response;


import lombok.Builder;

@Builder
public record BidSyncResponse(
        Boolean isHighestBidder,
        ItemInfo item,
        TimerInfo timer
) {

    @Builder
    public record ItemInfo(
            Long bidUnit,
            Long currentPrice
    ) {}

    @Builder
    public record TimerInfo(
            Integer durationSeconds,
            String serverNow,
            String serverStartedAt
    ) {}
}
