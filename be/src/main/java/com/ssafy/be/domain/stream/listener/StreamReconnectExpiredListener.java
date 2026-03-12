package com.ssafy.be.domain.stream.listener;

import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.stream.service.StreamWebSocketService;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
public class StreamReconnectExpiredListener extends KeyExpirationEventMessageListener {

    private static final String RECONNECT_KEY_PREFIX = "stream:reconnect:";

    private final StreamRepository streamRepository;
    private final StreamPublisher streamPublisher;

    public StreamReconnectExpiredListener(
            RedisMessageListenerContainer listenerContainer,
            StreamRepository streamRepository,
            StreamPublisher streamPublisher) {
        super(listenerContainer);
        this.streamRepository = streamRepository;
        this.streamPublisher = streamPublisher;
    }

    @Override
    @Transactional
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();

        // stream:reconnect:{streamId} 키만 처리
        if (!expiredKey.startsWith(RECONNECT_KEY_PREFIX)) {
            return;
        }

        Long streamId = Long.parseLong(expiredKey.replace(RECONNECT_KEY_PREFIX, ""));
        log.info("[Stream] 재연결 타임아웃 - streamId: {}", streamId);

        // Stream 상태를 FAILED로 변경
        streamRepository.findById(streamId).ifPresent(stream -> {
            stream.end();
            log.info("[Stream] 상태 FAILED 변경 - streamId: {}", streamId);
        });

        // 시청자들에게 실패 알림
        streamPublisher.broadcast(streamId, StreamEventType.STREAM_FAILED, null);
    }
}