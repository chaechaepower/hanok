package com.ssafy.be.domain.auction.dto.response;

import com.ssafy.be.domain.item.entity.ItemCondition;
import lombok.Builder;

@Builder
public record AuctionStartResponse(
        AuctionStartItemDto item,
        AuctionStartTimerDto timer
) {
    @Builder
    public record AuctionStartItemDto(
            String name,
            String image,
            ItemCondition condition,
            Long bidUnit,
            Long startPrice
    ) { }

    @Builder
    public record AuctionStartTimerDto(
            Integer durationSeconds,
            String serverNow,
            String serverStartedAt
    ) { }
}
