package com.ssafy.be.domain.auction.service;

import com.ssafy.be.domain.auction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.dto.response.BidPlaceResponse;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.exception.AuctionErrorCode;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.global.exception.GlobalErrorCode;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Slf4j
@RequiredArgsConstructor
@Component
public class AuctionBidFacade {
    private static final int MAX_RETRY = 3;
    private final RedissonClient redissonClient;
    private final AuctionBidService auctionBidService;

    public BidPlaceResponse.BidInfoDto processBid(BidPlaceRequest request, Auction auction, User user)  {
        String key = AuctionRedisKeys.getLockKey(auction.getId());
        RLock lock = redissonClient.getLock(key);

        int retry = 0;

        while (retry < MAX_RETRY) {
            try {
                if (tryLock(lock)) {
                    try {
                        return auctionBidService.saveBid(request, auction, user);
                    } finally {
                        unlock(lock);
                    }
                }

                retry++;

                Thread.sleep(50); // 약간 대기 후 재시도

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("입찰 처리 중 인터럽트 발생 auctionId={}", auction.getId(), e);
                throw new StompException(GlobalErrorCode.INTERNAL_SERVER_ERROR);
            }
        }

        throw new StompException(AuctionErrorCode.AUCTION_BID_CONFLICT);
    }

    private boolean tryLock(RLock lock) throws InterruptedException {
        return lock.tryLock(200, 1000, TimeUnit.MILLISECONDS);
    }

    private void unlock(RLock lock) {
        if (lock.isLocked() && lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
