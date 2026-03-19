package com.ssafy.be.domain.escrow.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record EscrowDetailResponse(
        WinningDto winningInfo,
        ShippingAddressDto shippingAddress,
        DeliveryDto delivery
) {

    @Builder
    public record WinningDto(
            String image,
            String itemName,
            Long finalPrice,
            String sellerName,
            Long sellerId,
            LocalDateTime wonAt
    ) {
    }

    @Builder
    public record ShippingAddressDto(
            String name,
            String phone,
            Integer postalCode,
            String address,
            String addressDetail
    ) {
    }

    @Builder
    public record DeliveryDto(
            String carrierName,
            String trackingNumber
    ) {
    }
}
