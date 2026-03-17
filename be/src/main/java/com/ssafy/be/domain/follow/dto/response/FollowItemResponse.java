package com.ssafy.be.domain.follow.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record FollowItemResponse(
        Long followId,
        SellerSummaryResponse seller,
        LocalDateTime followedAt
) {}
