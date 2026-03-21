package com.ssafy.be.domain.auction.listener;

import com.ssafy.be.domain.bottomupauction.service.BottomUpAuctionService;
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
    private final BottomUpAuctionService bottomUpAuctionService;
    private final StreamPublisher streamPublisher;

    public RedisAuctionTimerKeyExpirationListener(
            RedisMessageListenerContainer listenerContainer,
            BottomUpAuctionService bottomUpAuctionService,
            StreamPublisher streamPublisher
    ) {
        super(listenerContainer);
        this.bottomUpAuctionService = bottomUpAuctionService;
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

        // 이미 걸러지지만 명시적 방어
        if (expiredKey.startsWith("unique:")) return;

        // 만료된 key가 경매 타이머 key가 아니라면 무시
        if (!AuctionRedisKeys.isTimerKey(expiredKey)) {
            return;
        }

        // key에서 auctionId 추출
        Long auctionId = AuctionRedisKeys.extractAuctionId(expiredKey);

        log.info("경매 타이머 종료 auctionId={}", auctionId);

        // 경매 종료 처리
        List<StreamPublishTask> streamPublishTasks = bottomUpAuctionService.endAuction(auctionId);

        streamPublishTasks.forEach(streamPublisher::publish);
    }
}
