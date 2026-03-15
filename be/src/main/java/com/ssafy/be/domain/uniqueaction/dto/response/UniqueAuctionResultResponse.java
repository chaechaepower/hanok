package com.ssafy.be.domain.uniqueaction.dto.response;

import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.uniqueaction.dto.model.DuplicatePriceInfo;
import lombok.Builder;

import java.util.List;

@Builder
public record UniqueAuctionResultResponse(
        boolean isWon,
        Long winnerId,
        Long winnerPrice,
        List<DuplicatePriceInfo> topDuplicates,
        ShippingAddress shippingAddress
) {}
