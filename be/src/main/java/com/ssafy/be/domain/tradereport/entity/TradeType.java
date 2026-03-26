package com.ssafy.be.domain.tradereport.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TradeType {
    CHARGE("충전"),
    WITHDRAW("출금"),
    SETTLEMENT("정산"),
    PENALTY("패널티");

    private final String value;
}
