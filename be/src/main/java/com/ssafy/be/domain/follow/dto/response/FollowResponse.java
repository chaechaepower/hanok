package com.ssafy.be.domain.follow.dto.response;

import lombok.Builder;

@Builder
public record FollowResponse(
        Boolean following,
        Long followerCount,
        Long followingCount
) {}