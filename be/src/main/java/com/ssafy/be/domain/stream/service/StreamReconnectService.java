package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.domain.stream.repository.StreamReconnectRedisRepository;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreamReconnectService {

    private final StreamRepository streamRepository;
    private final StreamReconnectRedisRepository reconnectRedisRepository;
    private final StreamWebSocketService streamWebSocketService;

    // 판매자 연결 끊김 처리
    @Transactional
    public void handleDisconnect(Long streamId, Long sellerId) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        // LIVE 상태일 때만 처리
        if (stream.getStatus() != StreamStatus.LIVE) {
            return;
        }

        // 판매자 본인인지 확인
        if (!stream.getSeller().getUser().getId().equals(sellerId)) {
            return;
        }

        log.info("[Stream] 판매자 연결 끊김 - streamId: {}", streamId);

        // Stream 상태 PAUSED로 변경
        stream.pause();

        // Redis에 30초 타이머 시작
        reconnectRedisRepository.startTimer(streamId);

        // 시청자들에게 알림
        streamWebSocketService.sendStreamPaused(streamId);
    }

    // 판매자 재연결 처리
    @Transactional
    public void handleReconnect(Long streamId, Long sellerId) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        // PAUSED 상태일 때만 처리
        if (stream.getStatus() != StreamStatus.PAUSED) {
            return;
        }

        // 판매자 본인인지 확인
        if (!stream.getSeller().getUser().getId().equals(sellerId)) {
            return;
        }

        log.info("[Stream] 판매자 재연결 성공 - streamId: {}", streamId);

        // 타이머 취소
        reconnectRedisRepository.cancelTimer(streamId);

        // Stream 상태 LIVE로 복구
        stream.resume();

        // 시청자들에게 알림
        streamWebSocketService.sendStreamResumed(streamId);
    }
}