package com.ssafy.be.domain.wallet.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentStatus {
    READY("결제 시작 전"),
    PENDING("결제 진행중"),
    VIRTUAL_ACCOUNT_ISSUED("가상계좌 발급 완료"),
    PAID("결제 완료"),
    FAILED("결제 실패"),
    CANCELLED("취소/환불"),
    ;

    private final String value;
}
