package com.ssafy.be.domain.auction.repository;

import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@RequiredArgsConstructor
@Repository
public class AuctionTimerPausedRepository {
    private final RedisOperator redisOperator;

    public void save(Long auctionId, long remainingSeconds) {
        String key = AuctionRedisKeys.getPausedKey(auctionId);
        redisOperator.setValue(key, String.valueOf(remainingSeconds));
    }

    public Optional<Long> findByAuctionId(Long auctionId) {
        String key = AuctionRedisKeys.getPausedKey(auctionId);
        return Optional.ofNullable(redisOperator.getValue(key))
                .map(Long::parseLong);
    }

    public void delete(Long auctionId) {
        String key = AuctionRedisKeys.getPausedKey(auctionId);
        redisOperator.delete(key);
    }
}
