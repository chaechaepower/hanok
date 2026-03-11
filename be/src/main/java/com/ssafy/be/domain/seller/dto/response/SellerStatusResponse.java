package com.ssafy.be.domain.seller.dto.response;

public record SellerStatusResponse(
        boolean isSeller,
        Long sellerId
) {}