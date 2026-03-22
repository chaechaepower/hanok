package com.ssafy.be.domain.uniqueaction.dto.request;

import lombok.Builder;

@Builder
public record UniqueBidCalculateRequest(
        Long auctionId
) {
}
