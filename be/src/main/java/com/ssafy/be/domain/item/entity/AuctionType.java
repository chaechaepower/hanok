package com.ssafy.be.domain.item.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuctionType {
    UNIQUE_TOP("유일 최고가"),
    BOTTOM_UP("상향식");

    private final String value;
}
