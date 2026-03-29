package com.ssafy.be.domain.auction.listener;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.service.BottomUpAuctionService;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.ssafy.be.domain.item.entity.AuctionType.BOTTOM_UP;
import static com.ssafy.be.domain.item.entity.AuctionType.UNIQUE_TOP;


@Slf4j
@Component
public class RedisAuctionTimerKeyExpirationListener extends KeyExpirationEventMessageListener {
    private final AuctionRepository auctionRepository;
    private final BottomUpAuctionService bottomUpAuctionService;
    private final UniqueBidAuctionService uniqueBidAuctionService;
    private final StreamPublisher streamPublisher;

    public RedisAuctionTimerKeyExpirationListener(
            RedisMessageListenerContainer listenerContainer,
            AuctionRepository auctionRepository,
            BottomUpAuctionService bottomUpAuctionService,
            UniqueBidAuctionService uniqueBidAuctionService,
            StreamPublisher streamPublisher
    ) {
        super(listenerContainer);
        this.auctionRepository = auctionRepository;
        this.bottomUpAuctionService = bottomUpAuctionService;
        this.uniqueBidAuctionService = uniqueBidAuctionService;
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

        Auction auction = auctionRepository.findById(auctionId).orElse(null);
        if (auction == null) {
            log.warn("경매 타이머 만료됐으나 경매 엔티티 없음 auctionId={}", auctionId);
            return;
        }

        log.info("경매 타이머 종료 auctionId={} type={}", auctionId, auction.getAuctionType());

        List<StreamPublishTask> streamPublishTasks = List.of();

        if (UNIQUE_TOP.equals(auction.getAuctionType())) {
            // 유일최고가: 집계 없이 종료 메시지 broadcast
            streamPublishTasks = uniqueBidAuctionService.publishTimerExpiredEndPublicOnly(auctionId);
        } else if (BOTTOM_UP.equals(auction.getAuctionType())) {
            streamPublishTasks = bottomUpAuctionService.endAuction(auctionId);
        }

        streamPublishTasks.forEach(streamPublisher::publish);
    }
}
