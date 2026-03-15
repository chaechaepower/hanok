package com.ssafy.be.domain.uniqueaction.dto.request;

public record UniqueBidPlaceRequest(
        Long auctionId,
        Long amount
) {
}
