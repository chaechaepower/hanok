package com.ssafy.be.domain.stream.repository;

import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Map;

@Repository
@RequiredArgsConstructor
public class MacroRedisRepository {

    private static final String MACRO_KEY = "stream:macros:";
    private final RedisOperator redisOperator;

    public void saveAll(Long streamId, Map<String, String> macros) {
        redisOperator.putHashEntries(MACRO_KEY + streamId, macros);
    }

    public Map<Object, Object> findAll(Long streamId) {
        return redisOperator.getHashEntries(MACRO_KEY + streamId);
    }

    public void deleteAll(Long streamId) {
        redisOperator.delete(MACRO_KEY + streamId);
    }

    public String findOne(Long streamId, String questionType) {
        Object value = redisOperator.getHashEntry(MACRO_KEY + streamId, questionType);
        return value != null ? value.toString() : null;
    }
}