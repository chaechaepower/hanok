package com.ssafy.be.domain.escrow.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EscrowStatus {
    DEPOSITED("예치됨"),
    INVOICE_SUBMITTED("송장 등록 완료"),
    COMPLETED("거래 완료"),
    CANCELLED("거래 취소");

    private final String value;
}
