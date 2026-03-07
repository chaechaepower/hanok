package com.ssafy.be.domain.user.dto.response;

public record LoginResponseDto(
        String accessToken,
        String refreshToken
) {}