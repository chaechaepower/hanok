package com.ssafy.be.domain.auction.dto.response;

import lombok.Builder;

@Builder
public record AuctionCommentResponse(
        String message
) {
}
