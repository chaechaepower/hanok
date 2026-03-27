package com.ssafy.be.domain.stream.dto.response;

public record SellerRankingResponse(
        int rank,
        Long sellerId,
        String shopName,
        String profileImage,
        long followerCount
) {}
