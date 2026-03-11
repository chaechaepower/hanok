package com.ssafy.be.domain.auction.dto.request;

import lombok.Builder;

@Builder
public record AuctionStartRequest(
        Long auctionId
) {
}
