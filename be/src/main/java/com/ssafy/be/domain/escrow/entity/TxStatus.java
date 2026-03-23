package com.ssafy.be.domain.escrow.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TxStatus {
    PENDING("민팅 대기중"),
    COMPLETED("민팅 완료"),
    FAILED("민팅 실패");

    private final String value;
}