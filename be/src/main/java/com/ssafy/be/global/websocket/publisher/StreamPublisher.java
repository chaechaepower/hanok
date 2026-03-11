package com.ssafy.be.global.websocket.publisher;

import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StreamPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public <T> void broadcastToStream(Long streamId, StreamEventType eventType, T payload) {
        messagingTemplate.convertAndSend(
                "/broadcast/streams/" + streamId,

                StompResponse.<T>builder()
                        .eventType(eventType)
                        .payload(payload)
                        .build()
        );
    }

    public <T> void sendToUser(Long userId, Long streamId, StreamEventType eventType, T payload) {
        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId),

                "/private/streams/" + streamId,

                StompResponse.<T>builder()
                        .eventType(eventType)
                        .payload(payload)
                        .build()
        );
    }
}
