package com.ssafy.be.domain.notification.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {

    // ===== 거래 시작 =====
    ESCROW_STARTED_FOR_BUYER(
            "거래 시작",
            "%s을 낙찰하여 거래가 시작되었습니다."
    ),

    ESCROW_STARTED_FOR_SELLER(
            "새로운 주문",
            "%s님이 %s을 낙찰했습니다. 배송을 준비해주세요."
    ),

    // ===== 배송 시작 =====
    ESCROW_SHIPPED_FOR_BUYER(
            "상품 발송",
            "%s님이 %s을 발송했습니다. 곧 받아보실 수 있어요."
    ),

    ESCROW_SHIPPED_FOR_SELLER(
            "배송 시작",
            "%s을 발송했습니다. 구매자에게 배송 중입니다."
    ),

    // ===== 거래 완료 =====
    ESCROW_COMPLETED(
            "거래 완료",
            "%s 거래가 안전하게 완료되었습니다."
    ),

    ESCROW_AUTO_COMPLETED(
            "거래 자동 확정",
            "%s 구매 확정이 이루어지지 않아 자동으로 거래가 완료되었습니다."
    ),

    // ===== 거래 취소 =====
    ESCROW_CANCELLED(
            "거래 취소",
            "%s 거래가 취소되었습니다."
    ),

    // ===== 공지사항 등록 =====
    NOTICE_CREATE(
            "공지사항 등록",
            "%s님이 공지사항을 게시했습니다."
    ),

    // ===== 방송 시작 =====
    STREAM_START(
            "방송 시작",
                    "%s님이 방송을 시작했습니다."
    );


    private final String title;
    private final String body;

    public String renderBody(Object... args) {
        return String.format(body, args);
    }
}
