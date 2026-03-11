package com.ssafy.be.domain.stream.service;

import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StreamViewerService {

    private static final String VIEWER_COUNT_KEY = "stream:viewerCount:";
    private final RedisOperator redisOperator;

    public void increment(Long streamId) {
        redisOperator.incrementValue(VIEWER_COUNT_KEY + streamId);
    }

    public void decrement(Long streamId) {
        redisOperator.decrementValue(VIEWER_COUNT_KEY + streamId);
    }

    public long getViewerCount(Long streamId) {
        String value = redisOperator.getValue(VIEWER_COUNT_KEY + streamId);
        return value != null ? Long.parseLong(value) : 0L;
    }
}