package com.ssafy.be.domain.follow.dto.response;

import lombok.Builder;

@Builder
public record SellerSummaryResponse(
        Long sellerId,
        String nickname,
        String profileImageUri,
        Double rating
) {}