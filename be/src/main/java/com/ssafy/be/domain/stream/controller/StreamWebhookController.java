package com.ssafy.be.domain.stream.controller;

import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.domain.stream.service.StreamReconnectService;
import com.ssafy.be.domain.stream.service.StreamViewerService;
import com.ssafy.be.global.exception.GlobalErrorCode;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.livekit.LiveKitProperties;
import io.livekit.server.WebhookReceiver;
import livekit.LivekitWebhook.WebhookEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/streams")
@RequiredArgsConstructor
@SuppressWarnings("java:S112")
public class StreamWebhookController {

    private final StreamViewerService streamViewerService;
    private final LiveKitProperties liveKitProperties;
    private final StreamReconnectService streamReconnectService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody String body) {

        try {
            WebhookReceiver receiver =
                    new WebhookReceiver(liveKitProperties.apiKey(), liveKitProperties.apiSecret());

            WebhookEvent event = receiver.receive(body, authHeader);
            String eventType = event.getEvent();
            Long streamId = Long.parseLong(event.getRoom().getName());
            String identity = event.getParticipant().getIdentity();

            if ("participant_joined".equals(eventType)) {
                // guest면 숫자 변환 불가 → 무시
                if (!identity.startsWith("guest-")) {
                    log.info("[livekit webhook] 입장 identiy={}", identity);

                    Long userId = Long.parseLong(identity);
                    streamReconnectService.handleReconnect(streamId, userId);
                }

            } else if ("participant_left".equals(eventType)) {
                // 시청자 수 감소
                streamViewerService.leave(streamId, identity);

                // guest면 재연결 로직 불필요 → 무시
                if (!identity.startsWith("guest-")) {
                    log.info("[livekit webhook] 입장 identiy={}", identity);

                    Long userId = Long.parseLong(identity);
                    streamReconnectService.handleDisconnect(streamId, userId);
                }
            }

        } catch (Exception e) {
            log.error("[error] livekit webhook 에러 발생 {}", e.getMessage(), e);
            throw new GlobalException(GlobalErrorCode.INTERNAL_SERVER_ERROR);
        }

        return ResponseEntity.ok().build();
    }
}
