package com.ssafy.be.auction;

import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RedisKeyExpirationListener extends KeyExpirationEventMessageListener {
    private final AuctionService auctionService;

    public RedisKeyExpirationListener(
            RedisMessageListenerContainer listenerContainer,
            AuctionService auctionService
    ) {
        super(listenerContainer);
        this.auctionService = auctionService;
    }

    /**
     * 만료된 키에 대해 처리
     *
     * @param message redis key
     * @param pattern __keyevent@*__:expired
     */
    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();

        // 만료된 key가 경매 타이머 key가 아니라면 무시
        if (!AuctionRedisKeys.isTimerKey(expiredKey)) {
            return;
        }

        // key에서 auctionId 추출
        Long auctionId = AuctionRedisKeys.extractAuctionId(expiredKey);

        log.info("경매 타이머 완료 auctionId={}", auctionId);

        // 경매 종료 처리
        //auctionService.endAuction(auctionId);
    }
}
