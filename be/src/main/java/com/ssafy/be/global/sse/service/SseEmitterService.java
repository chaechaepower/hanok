package com.ssafy.be.global.sse.service;

import com.ssafy.be.global.sse.enums.SseEventType;
import com.ssafy.be.global.sse.repository.SseEmitterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
@Service
public class SseEmitterService {
    public static final String SSE_CONNECT_DATA = "connected!";
    private final SseEmitterRepository sseEmitterRepository;

    public SseEmitter subscribe(Long userId) {
        SseEmitter sseEmitter = sseEmitterRepository.save(userId, new SseEmitter()); // timeout 시간은 일단 default로 설정

        // sse 연결 끝날 시 삭제 콜백 등록
        sseEmitter.onCompletion(() ->
                sseEmitterRepository.deleteById(userId)
        );

        // sse timeout 발생 시 삭제 콜백 등록
        sseEmitter.onTimeout(() -> {
                    sseEmitter.complete();
                    sseEmitterRepository.deleteById(userId);
                }
        );

        // 첫 구독 시 더미 데이터 전송(emitter 생성 후 만료 시간까지 데이터 전송을 하지 않을 경우, 재연결 요청 시 503 에러 발생)
        sendToClient(SseEventType.CONNECT, userId, SSE_CONNECT_DATA);

        return sseEmitter;
    }

    public void sendToClient(SseEventType eventType, Long userId, Object data) {
        SseEmitter sseEmitter = sseEmitterRepository.findById(userId);

        if (sseEmitter == null) {
            log.debug("SSE emitter가 없습니다. 전송을 스킵합니다. userId={}, eventType={}", userId, eventType);
            return;
        }

        try {
            sseEmitter.send(
                    SseEmitter.event()
                            .name(eventType.name())
                            .data(data)
            );
        } catch (IOException ex) {
            log.debug("SSE 연결 종료. userId={}", userId);
            sseEmitter.complete();
            sseEmitterRepository.deleteById(userId);
        }
    }
}
