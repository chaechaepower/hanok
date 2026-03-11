package com.ssafy.be.domain.user.dto.response;

public record AccountRegisterResponse(
        String bankName,
        String accountName,
        String accountNum
) {}
