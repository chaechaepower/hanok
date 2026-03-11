package com.ssafy.be.domain.auction.dto.request;

public record BidPlaceRequest(
        Long auctionId,
        Long amount
) {
}
