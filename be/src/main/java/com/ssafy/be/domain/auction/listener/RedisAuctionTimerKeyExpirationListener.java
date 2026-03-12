package com.ssafy.be.domain.auction.listener;

import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import java.util.List;


@Slf4j
@Component
public class RedisAuctionTimerKeyExpirationListener extends KeyExpirationEventMessageListener {
    private final AuctionService auctionService;
    private final StreamPublisher streamPublisher;

    public RedisAuctionTimerKeyExpirationListener(
            RedisMessageListenerContainer listenerContainer,
            AuctionService auctionService,
            StreamPublisher streamPublisher
    ) {
        super(listenerContainer);
        this.auctionService = auctionService;
        this.streamPublisher = streamPublisher;
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

        log.info("경매 타이머 종료 auctionId={}", auctionId);

        // 경매 종료 처리
        List<StreamPublishTask> streamPublishTasks = auctionService.endAuction(auctionId);

        streamPublishTasks.forEach(streamPublisher::publish);
    }
}
