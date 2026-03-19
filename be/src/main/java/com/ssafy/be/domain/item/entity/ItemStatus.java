package com.ssafy.be.domain.item.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ItemStatus {
    READY("판매 대기"), // 물품 등록만 한 상태
    SCHEDULED("방송 예약"), // 방송 예약 시 해당 물품 등록하여 예약한 상태
    PENDING("판매중"),
    SOLD("판매 완료");

    private final String value;
}
