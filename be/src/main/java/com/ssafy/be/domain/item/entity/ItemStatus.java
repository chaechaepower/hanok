package com.ssafy.be.domain.item.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ItemStatus {
    READY("판매 대기"),
    PENDING("판매중"),
    SOLD("판매 완료");

    private final String value;
}
