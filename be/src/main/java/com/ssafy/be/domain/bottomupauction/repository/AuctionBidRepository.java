package com.ssafy.be.domain.bottomupauction.repository;

import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
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

    public List<Bid> findAll(Long auctionId) {
        String key = AuctionRedisKeys.getBidKey(auctionId);

        Set<String> result = redisOperator.getZSetReverseRange(key, 0, -1); // score 내림차순(높은 가격순)

        if (result == null || result.isEmpty()) {
            return new ArrayList<>();
        }

        return result.stream()
                .map(json -> jsonConverter.convert(json, Bid.class))
                .toList();
    }

    public List<Bid> findTopBids(Long auctionId, int limit) {
        String key = AuctionRedisKeys.getBidKey(auctionId);

        if (limit <= 0) {
            return List.of();
        }

        // score 내림차순으로 상위 N개만 조회
        Set<String> result = redisOperator.getZSetReverseRange(key, 0, limit - 1);

        if (result == null || result.isEmpty()) {
            return new ArrayList<>();
        }

        return result.stream()
                .map(json -> jsonConverter.convert(json, Bid.class))
                .toList();
    }

    public Optional<Bid> findTopBid(Long auctionId) {
        String key = AuctionRedisKeys.getBidKey(auctionId);

        Set<String> result = redisOperator.getZSetReverseRange(key, 0, 0);

        if (result == null || result.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(jsonConverter.convert(result.iterator().next(), Bid.class));
    }

    public long countBids(Long auctionId) {
        String key = AuctionRedisKeys.getBidKey(auctionId);
        Long size = redisOperator.getZSetSize(key);
        return size != null ? size : 0L;
    }
}
