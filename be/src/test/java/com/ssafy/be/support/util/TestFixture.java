package com.ssafy.be.support.util;

import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.model.WalletCharge;

import java.util.UUID;

public class TestFixture {
    public static User createTestUser(String name) {
        return User.createUser(
                "test" + UUID.randomUUID() + "@test.com",
                "password",
                name != null ? name : "테스트 유저",
                "010-1234-5678"
        );
    }

    public static WalletCharge createWalletCharge(Long userId, PaymentStatus status) {
        return WalletCharge.builder()
                .userId(userId)
                .amount(10000L)
                .status(status)
                .build();
    }
}
