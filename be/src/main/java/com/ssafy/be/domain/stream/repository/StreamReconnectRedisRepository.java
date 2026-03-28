package com.ssafy.be.domain.stream.repository;

import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

@Repository
@RequiredArgsConstructor
public class StreamReconnectRedisRepository {
    private static final String RECONNECT_KEY = "stream:reconnect:";
    private static final long RECONNECT_TIMEOUT_SECONDS = 300L;

    private final RedisOperator redisOperator;

    // 재연결 대기 타이머 시작 (5분 TTL)
    public void startTimer(Long streamId) {
        String key = RECONNECT_KEY + streamId;
        redisOperator.setValue(key, "waiting");
        redisOperator.setExpire(key, RECONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    // 재연결 성공 시 타이머 제거
    public void cancelTimer(Long streamId) {
        redisOperator.delete(RECONNECT_KEY + streamId);
    }

    // 타이머가 살아있는지 확인 (재연결 대기 중인지)
    public boolean isWaiting(Long streamId) {
        return redisOperator.containsKey(RECONNECT_KEY + streamId);
    }

    // 남은 시간 조회 (초)
    public long getRemainingSeconds(Long streamId) {
        return redisOperator.getExpire(RECONNECT_KEY + streamId);
    }
}