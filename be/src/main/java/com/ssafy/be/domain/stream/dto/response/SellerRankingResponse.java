package com.ssafy.be.domain.stream.dto.response;

public record SellerRankingResponse(
        int rank,
        Long sellerId,
        String nickname,
        String profileImage,
        long followerCount
) {}
