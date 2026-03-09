package com.ssafy.be.domain.wallet.repository;

import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.model.WalletCharge;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RequiredArgsConstructor
@Repository
public class WalletChargeRepository {
    private static final String WALLET_CHARGE_REDIS_KEY = "wallet:charge:%s"; // TODO: redis key 따로 관리
    private final RedisOperator redisOperator;
    private final JsonConverter jsonConverter;

    public static String getWalletChargeKey(String paymentId) {
        return String.format(WALLET_CHARGE_REDIS_KEY, paymentId);
    }

    public Optional<WalletCharge> findByPaymentId(String paymentId) {
        String key = getWalletChargeKey(paymentId);

        return Optional.ofNullable(redisOperator.getHashEntries(key))
                .filter(map -> !map.isEmpty())
                .map(map -> jsonConverter.fromHash(map, WalletCharge.class));
    }

    public void save(String paymentId, WalletCharge walletCharge) {
        String key = getWalletChargeKey(paymentId);
        Map<String, String> value = jsonConverter.toHash(walletCharge);

        redisOperator.putHashEntries(key, value);
        redisOperator.setExpire(key, 30, TimeUnit.MINUTES); // TTL 설정
    }

    public void updatePaymentStatus(String paymentId, PaymentStatus status) {
        String key = getWalletChargeKey(paymentId);
        redisOperator.updateHashField(key, "paymentStatus", status.name());
    }

    public void deleteByPaymentId(String paymentId) {
        String key = getWalletChargeKey(paymentId);
        redisOperator.delete(key);
    }
}
