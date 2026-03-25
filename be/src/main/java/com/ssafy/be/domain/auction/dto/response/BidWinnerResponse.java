package com.ssafy.be.domain.auction.dto.response;

import lombok.Builder;


@Builder
public record BidWinnerResponse(
        ItemDto item,
        ShippingDto shipping
) {
    @Builder
    public record ItemDto(
            String itemName,
            Long finalPrice,
            Long myBidPrice
    ){}

    @Builder
    public record ShippingDto(
            String recipientName,
            String addressName,
            Integer postalCode,
            String address,
            String addressDetail,
            String phone
    ){}
}


