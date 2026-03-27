package com.ssafy.be.domain.search.dto.response;

import lombok.Builder;

@Builder
public record SellerSearchResult(
        Long sellerId,
        String shopName,
        String profileImage,
        String intro,
        Double rating,
        boolean isFollowed
) {}
