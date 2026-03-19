package com.ssafy.be.domain.stream.service;

import com.ssafy.be.global.infra.redis.RedisOperator;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StreamViewerService {

    private static final String VIEWER_SET_KEY = "stream:viewers:";
    private final RedisOperator redisOperator;

    // 입장 - 이미 있으면 추가 안 함 (Set이라 자동 중복 제거)
    public String enter(Long streamId, Long userId) {
        String identity = userId != null ? String.valueOf(userId) : "guest-" + UUID.randomUUID();
        redisOperator.addToSet(VIEWER_SET_KEY + streamId, identity);
        return identity;
    }

    // 퇴장
    public void leave(Long streamId, String identity) {
        redisOperator.removeFromSet(VIEWER_SET_KEY + streamId, identity);
    }

    public long getViewerCount(Long streamId) {
        return redisOperator.getSetSize(VIEWER_SET_KEY + streamId);
    }

    public void clearViewers(Long streamId) {
        redisOperator.delete(VIEWER_SET_KEY + streamId);
    }
}