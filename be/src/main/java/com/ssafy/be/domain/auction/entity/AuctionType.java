package com.ssafy.be.domain.auction.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuctionType {
    TOP_DOWN("하향식"),
    BOTTOM_UP("상향식");

    private final String value;
}
