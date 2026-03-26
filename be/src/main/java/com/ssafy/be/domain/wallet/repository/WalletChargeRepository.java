package com.ssafy.be.domain.wallet.repository;

import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.model.WalletCharge;
import com.ssafy.be.domain.wallet.util.WalletRedisKeys;
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
    private final RedisOperator redisOperator;
    private final JsonConverter jsonConverter;

    public Optional<WalletCharge> findByPaymentId(String paymentId) {
        String key = WalletRedisKeys.getWalletChargeRedisKey(paymentId);

        return Optional.ofNullable(redisOperator.getHashEntries(key))
                .filter(map -> !map.isEmpty())
                .map(map -> jsonConverter.fromHash(map, WalletCharge.class));
    }

    public void save(String paymentId, WalletCharge walletCharge) {
        String key = WalletRedisKeys.getWalletChargeRedisKey(paymentId);
        Map<String, String> value = jsonConverter.toHash(walletCharge);

        redisOperator.putHashEntries(key, value);
        redisOperator.setExpire(key, 30, TimeUnit.MINUTES); // TTL 설정
    }

    public void updatePaymentStatus(String paymentId, PaymentStatus status) {
        String key = WalletRedisKeys.getWalletChargeRedisKey(paymentId);
        redisOperator.updateHashField(key, "status", status.name());
    }

    public void deleteByPaymentId(String paymentId) {
        String key = WalletRedisKeys.getWalletChargeRedisKey(paymentId);
        redisOperator.delete(key);
    }
}
