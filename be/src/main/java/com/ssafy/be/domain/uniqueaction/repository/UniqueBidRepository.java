package com.ssafy.be.domain.uniqueaction.repository;

import com.ssafy.be.domain.uniqueaction.dto.model.DuplicatePriceInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;


@Repository
@RequiredArgsConstructor
public class UniqueBidRepository {

    private final StringRedisTemplate redisTemplate;

    private String bidKey(Long id) {
        return "unique:bids:" + id;
    }

    private String countKey(Long id) {
        return "unique:counts:" + id;
    }

    // TODO : 원자적 보장 강화 필요
    public boolean placeBid(Long auctionId, Long userId, Long amount) {
        Boolean isNew = redisTemplate.opsForHash().
                putIfAbsent(bidKey(auctionId),userId.toString(),amount.toString());

        if (Boolean.FALSE.equals(isNew)) return false;

        redisTemplate.opsForHash().increment(countKey(auctionId),amount.toString(),1);
        return true;

    }

    public long countParticipants(Long auctionId) {
        return redisTemplate.opsForHash().size(bidKey(auctionId));
    }

    public Map<Object, Object> getAllBids(Long auctionId) {
        return redisTemplate.opsForHash().entries(bidKey(auctionId));
    }

    // 유일 최고가 탐색
    public Optional<Long> findHighestUniqueBid (Long auctionId) {
        return redisTemplate.opsForHash().entries(countKey(auctionId))
                .entrySet().stream()
                .filter(e -> Long.parseLong(e.getValue().toString()) == 1L)
                .map(e -> Long.parseLong(e.getKey().toString()))
                .max(Long::compareTo);
    }

    // 가장 많이 겹친 가격
    public List<DuplicatePriceInfo> findTopCntDuplicate (Long auctionId, int limit) {
        return redisTemplate.opsForHash().entries(countKey(auctionId))
                .entrySet().stream()
                .filter((e -> Long.parseLong(e.getValue().toString())> 1L))
                .sorted((a,b) -> Long.compare(
                        Long.parseLong(b.getValue().toString()),
                        Long.parseLong(a.getValue().toString())
                ))
                .limit(limit)
                .map(e -> new DuplicatePriceInfo(
                        Long.parseLong(e.getKey().toString()),
                        Long.parseLong(e.getValue().toString())
                )).toList();
    }

    // 가장 높은 중복 가격
    public List<DuplicatePriceInfo> findTopPriceDuplicate (Long auctionId, int limit) {
        return redisTemplate.opsForHash().entries(countKey(auctionId))
                .entrySet().stream()
                .filter((e -> Long.parseLong(e.getValue().toString())> 1L))
                .sorted((a,b) -> Long.compare(
                        Long.parseLong(b.getValue().toString()),
                        Long.parseLong(a.getValue().toString())
                ))
                .limit(limit)
                .map(e -> new DuplicatePriceInfo(
                        Long.parseLong(e.getKey().toString()),
                        Long.parseLong(e.getValue().toString())
                )).toList();
    }


    public Optional<Long> findUserIdByAmount(Long auctionId, Long amount) {
        return getAllBids(auctionId).entrySet().stream()
                .filter(entry -> Long.parseLong(entry.getValue().toString()) == amount)
                .map(entry -> Long.parseLong(entry.getKey().toString()))
                .findFirst();
    }

    public void deleteAll (Long auctionId) {
        redisTemplate.delete(List.of(bidKey(auctionId), countKey(auctionId)));
    }

}
