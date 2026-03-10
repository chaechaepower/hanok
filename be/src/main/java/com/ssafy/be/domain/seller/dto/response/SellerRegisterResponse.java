package com.ssafy.be.domain.seller.dto.response;

public record SellerRegisterResponse(
        Long sellerId,
        String nickname
) {}