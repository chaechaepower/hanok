package com.ssafy.be.auction;

import lombok.Builder;

@Builder
public record AuctionStartRequest(
        Long auctionId
) {
}
