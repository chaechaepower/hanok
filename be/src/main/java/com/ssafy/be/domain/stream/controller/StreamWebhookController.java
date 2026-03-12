package com.ssafy.be.domain.stream.controller;

import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.domain.stream.service.StreamViewerService;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.livekit.LiveKitProperties;
import io.livekit.server.WebhookReceiver;
import livekit.LivekitWebhook.WebhookEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/streams")
@RequiredArgsConstructor
public class StreamWebhookController {

    private final StreamViewerService streamViewerService;
    private final LiveKitProperties liveKitProperties;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader("Authorization") String authHeader, @RequestBody String body) {

        try {
            WebhookReceiver receiver =
                    new WebhookReceiver(liveKitProperties.apiKey(), liveKitProperties.apiSecret());

            WebhookEvent event = receiver.receive(body, authHeader);
            Long streamId = Long.parseLong(event.getRoom().getName());

            if ("participant_joined".equals(event.getEvent())) {
                streamViewerService.increment(streamId);
            } else if ("participant_left".equals(event.getEvent())) {
                streamViewerService.decrement(streamId);
            }
        } catch (Exception e) {
            throw new GlobalException(StreamErrorCode.INVALID_STREAM_EVENT_TYPE);
        }

        return ResponseEntity.ok().build();
    }
}
