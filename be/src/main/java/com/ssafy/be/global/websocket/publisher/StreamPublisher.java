package com.ssafy.be.global.websocket.publisher;

import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StreamPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public <T> void broadcast(Long streamId, StreamEventType eventType, T payload) {
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

    @SuppressWarnings("java:S1301")
    public <T> void publish(StreamPublishTask<T> task) {
        switch (task.getDestType()) {
            case BROADCAST -> broadcast(task.getStreamId(), task.getEventType(), task.getPayload());
            case PRIVATE -> sendToUser(task.getUserId(), task.getStreamId(), task.getEventType(),task.getPayload());
        }
    }
}
