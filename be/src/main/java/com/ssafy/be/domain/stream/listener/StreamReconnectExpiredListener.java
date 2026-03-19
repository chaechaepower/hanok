package com.ssafy.be.domain.stream.listener;

import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.stream.service.StreamReconnectService;
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
    private final StreamReconnectService streamReconnectService;

    public StreamReconnectExpiredListener(
            RedisMessageListenerContainer listenerContainer,
            StreamReconnectService streamReconnectService) {
        super(listenerContainer);
        this.streamReconnectService = streamReconnectService;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        if (!expiredKey.startsWith(RECONNECT_KEY_PREFIX)) {
            return;
        }
        Long streamId = Long.parseLong(expiredKey.replace(RECONNECT_KEY_PREFIX, ""));
        log.info("[Stream] 재연결 타임아웃 - streamId: {}", streamId);
        streamReconnectService.handleTimeout(streamId);
    }
}