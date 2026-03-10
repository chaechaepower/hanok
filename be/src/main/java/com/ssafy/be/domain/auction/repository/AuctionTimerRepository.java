package com.ssafy.be.domain.auction.repository;

import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

@RequiredArgsConstructor
@Repository
public class AuctionTimerRepository {
    public static final String AUCTION_TIMER_REDIS_VALUE = "NOT_USE_VALUE";
    private final RedisOperator redisOperator;

    public void save(Long auctionId, long duration) {
        String key = AuctionRedisKeys.getTimerKey(auctionId);
        redisOperator.setValue(key, AUCTION_TIMER_REDIS_VALUE);
        redisOperator.setExpire(key, duration, TimeUnit.SECONDS);
    }

    public boolean existsByAuctionId(Long auctionId) {
        String key = AuctionRedisKeys.getTimerKey(auctionId);
        return redisOperator.containsKey(key);
    }
}
