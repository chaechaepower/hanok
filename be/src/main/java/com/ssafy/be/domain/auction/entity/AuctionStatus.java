package com.ssafy.be.domain.auction.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuctionStatus {
    READY("경매 시작 전"),
    INTRODUCING("상품 설명중"),
    LIVE("경매중"),
    CALCULATING("결과 집계중"),
    SOLD("낙찰됨"),
    UNSOLD("유찰됨");

    private final String value;
}
