package com.ssafy.be.domain.bottomupauction.dto.request;

import lombok.Builder;

@Builder
public record AuctionStartRequest(
        Long auctionId
) {
}
