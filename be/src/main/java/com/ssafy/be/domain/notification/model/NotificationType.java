package com.ssafy.be.domain.notification.model;

public enum NotificationType {

    // 방송
    STREAM_STARTED,
    STREAM_SCHEDULED,

    // 경매/에스크로
    AUCTION_WON,
    AUCTION_LOST,
    ESCROW_REQUESTED,
    ESCROW_COMPLETED,

    // 배송
    DELIVERY_REGISTERED,
    DELIVERY_STARTED,
    DELIVERY_COMPLETED

}
