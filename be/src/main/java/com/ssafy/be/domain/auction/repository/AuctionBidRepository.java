package com.ssafy.be.domain.auction.repository;

import com.ssafy.be.domain.auction.model.Bid;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@RequiredArgsConstructor
@Repository
public class AuctionBidRepository {
    private final RedisOperator redisOperator;
    private final JsonConverter jsonConverter;

    public void save(Long auctionId, Bid bid) {
        String key = AuctionRedisKeys.getBidKey(auctionId);

        redisOperator.addZSet(
                key,
                jsonConverter.toJson(bid),
                bid.amount()
        );
    }

    public Optional<Bid> findTopBid(Long auctionId) {
        String key = AuctionRedisKeys.getBidKey(auctionId);

        Set<String> result = redisOperator.getZSetReverseRange(key, 0, 0);

        if (result == null || result.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(jsonConverter.convert(result.iterator().next(), Bid.class));
    }
}
