package com.ssafy.be.domain.uniqueaction.dto.model;

import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;

import java.util.List;

public record UniqueAuctionResult(
        boolean isWon,
        Long winnerId,
        Long winnerPrice,
        List<DuplicatePriceInfo> topDuplicates,
        ShippingAddress shippingAddress
) {
}
