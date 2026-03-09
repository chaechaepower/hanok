package com.ssafy.be.domain.wallet.model;

import lombok.Builder;

@Builder
public record WalletCharge(
        Long userId, // 웹훅 상황에서 필요
        Long amount,
        PaymentStatus status
) {
}
