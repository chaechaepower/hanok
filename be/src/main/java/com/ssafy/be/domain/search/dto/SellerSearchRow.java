package com.ssafy.be.domain.search.dto;

import lombok.Builder;

@Builder
public record SellerSearchRow(
        Long sellerId,
        String shopName,
        String profileImage,
        String intro,
        int penaltyCount,
        long completedTrades
) {}
