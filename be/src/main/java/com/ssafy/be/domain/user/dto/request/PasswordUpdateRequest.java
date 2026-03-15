package com.ssafy.be.domain.user.dto.request;

public record PasswordUpdateRequest(
        String currentPassword,
        String newPassword
) {}