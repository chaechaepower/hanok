package com.ssafy.be.domain.auction.dto.response;


import lombok.Builder;

@Builder
public record BidSyncResponse(
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
