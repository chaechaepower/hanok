package com.ssafy.be.domain.auction.dto.response;

import lombok.Builder;

@Builder
public record AuctionEndResponse(
        Long winnerId,
        Long streamId,
        WinnerDto winnerDto
){
    @Builder
    public record WinnerDto(
            ItemDto item,
            ShippingDto shipping
    ) {
        @Builder
        public record ItemDto(
                String itemName,
                Long finalPrice
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
}

