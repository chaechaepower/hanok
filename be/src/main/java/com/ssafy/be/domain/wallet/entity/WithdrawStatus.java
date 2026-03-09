package com.ssafy.be.domain.wallet.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WithdrawStatus {
    PENDING("출금 요청"),
    COMPLETED("송금 완료"),
    REJECTED("거절"),
    ;

    private final String value;
}
