package com.ssafy.be.domain.user.dto.response;

import com.ssafy.be.domain.user.entity.User;

public record UserProfileResponse(
        String email,
        String nickname,
        String profileImage,
        String phone,
        Long balance,
        Long depositedBalance
) {}