package com.ssafy.be.domain.search.dto.response;

import lombok.Builder;

@Builder
public record SellerInfo(
        Long sellerId,
        String nickname,
        String profileImageUri
) {}
