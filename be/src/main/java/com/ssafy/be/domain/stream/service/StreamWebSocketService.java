package com.ssafy.be.domain.stream.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class StreamWebSocketService {

    private static final String STREAM_TOPIC = "/broadcast/stream/";
    private static final String EVENT_KEY = "event";

    private final SimpMessagingTemplate messagingTemplate;

    public void sendStreamPaused(Long streamId) {
        messagingTemplate.convertAndSend(
                STREAM_TOPIC + streamId,
                Map.of(EVENT_KEY, "stream:paused")
        );
    }

    public void sendStreamResumed(Long streamId) {
        messagingTemplate.convertAndSend(
                STREAM_TOPIC + streamId,
                Map.of(EVENT_KEY, "stream:resumed")
        );
    }

    public void sendStreamFailed(Long streamId) {
        messagingTemplate.convertAndSend(
                STREAM_TOPIC + streamId,
                Map.of(EVENT_KEY, "stream:failed")
        );
    }
}