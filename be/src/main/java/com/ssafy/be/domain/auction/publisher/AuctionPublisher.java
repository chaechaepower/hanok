package com.ssafy.be.domain.auction.publisher;

import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StompType;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuctionPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public <T> void broadcastToStream(Long streamId, StompType eventType, T payload) {
        messagingTemplate.convertAndSend("/broadcast/stream/" + streamId, StompResponse.<T>builder()
                .eventType(eventType)
                .payload(payload)
                .build());
    }

    public <T> void sendToUser(Long userId, Long streamId, StompType eventType, T payload) {
        messagingTemplate.convertAndSendToUser(String.valueOf(userId), "/private/stream/" + streamId, StompResponse.<T>builder()
                .eventType(eventType)
                .payload(payload)
                .build());
    }
}
