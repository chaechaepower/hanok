package com.ssafy.be.domain.wallet.util;

public class WalletRedisKeys {
    private static final String WALLET = "wallet:";
    private static final String CHARGE = "charge";

    private WalletRedisKeys() {}

    public static String getWalletChargeRedisKey(String paymentId) {
        return WALLET + CHARGE + paymentId;
    }
}
