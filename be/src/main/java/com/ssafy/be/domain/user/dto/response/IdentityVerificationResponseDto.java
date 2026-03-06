package com.ssafy.be.domain.user.dto.response;

public record IdentityVerificationResponseDto(
        String name,
        String phoneNumber,
        String birthDate
) {}