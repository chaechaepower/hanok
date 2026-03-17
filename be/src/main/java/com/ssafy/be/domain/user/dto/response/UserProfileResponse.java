package com.ssafy.be.domain.user.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {
    private final String email;
    private final String nickname;
    private final String profileImage;
    private final String phone;
    private final Long balance;
    private final Long depositedBalance;
    private final String bankCode;
    private final String accountName;
    private final String accountNum;
    private final Long sellerId;
}