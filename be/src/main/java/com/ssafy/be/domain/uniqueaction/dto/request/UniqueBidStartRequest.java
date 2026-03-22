package com.ssafy.be.domain.uniqueaction.dto.request;

import lombok.Builder;

@Builder
public record UniqueBidStartRequest(
        Long auctionId
) {
}
