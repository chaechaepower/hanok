package com.ssafy.be.global.infra.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.global.exception.GlobalErrorCode;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RedisOperator {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /* ================================
     *           COMMON
     * ================================ */

    public boolean containsKey(String key) {
        return redisTemplate.hasKey(key);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    // TTL 설정
    public void setExpire(String key, long timeout, TimeUnit unit) {
        redisTemplate.expire(key, timeout, unit);
    }

    // TTL 조회 (초 단위)
    public long getExpire(String key) {
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null ? ttl : -2L; // -2: 키 없음, -1: TTL 없음
    }

    /* ================================
     *           HASH
     * ================================ */

    public Map<Object, Object> getHashEntries(String key) {
        return redisTemplate.opsForHash().entries(key);
    }

    public void putHashEntries(String key, Map<String, String> data) {
        redisTemplate.opsForHash().putAll(key, data);
    }

    public void updateHashField(String key, String hashKey, String value) {
        redisTemplate.opsForHash().put(key,hashKey,value);
    }

    public List<Map<Object, Object>> getHashEntriesPipelined(List<String> keys) {
        // 파이프라인에 담아서 한 번에 주기
        List<Object> results = redisTemplate.executePipelined(new SessionCallback<Object>() {
            @Override
            public <K, V> Object execute(RedisOperations<K, V> operations) throws DataAccessException {
                for (String key : keys) {
                    operations.opsForHash().entries((K) key);
                }
                return null;
            }
        });

        // Object 리스트를 Map 리스트로 캐스팅해서 반환
        return results.stream()
                .map(result -> (Map<Object, Object>) result)
                .collect(Collectors.toList());
    }

    // 모두 읽음처리
    public void updateHashFieldsPipelined(List<String> keys, String hashKey, String value) {
        redisTemplate.executePipelined(new SessionCallback<Object>() {
            @Override
            public <K, V> Object execute(RedisOperations<K, V> operations) {
                for (String key : keys) {
                    // "이 키들의 isRead 필드를 싹 다 true로 바꿔!" (명령어 장바구니 적재)
                    operations.opsForHash().put((K) key, hashKey, value);
                }
                return null;
            }
        });
    }

    /* ================================
     *           ZSet
     * ================================ */

    public void addZSet(String key, String value, double score) {
        redisTemplate.opsForZSet().add(key, value, score);
    }

    public Long getZSetSize(String key) {
        return redisTemplate.opsForZSet().zCard(key);
    }

    public Set<String> getZSetReverseRange(String key, long start, long end) {
        return redisTemplate.opsForZSet().reverseRange(key, start, end);
    }

    //유저당 알림 개수 제한 TODO: 회의 필요
    public void keepZSetMaxSize(String key, long maxSize) {
        redisTemplate.opsForZSet().removeRange(key, 0, -(maxSize + 1));
    }

    /* ================================
     *           String
     * ================================ */

    //안읽음 cnt
    public void incrementValue(String key) {
        redisTemplate.opsForValue().increment(key);
    }

    //읽음 처리시 cnt 감소
    public void decrementValue(String key) {
        redisTemplate.opsForValue().decrement(key);
    }

    //안읽음 개수 읽기
    public String getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    //안읽음 초기화
    public void setValue(String key, String value) {
        redisTemplate.opsForValue().set(key, value);
    }

    /* ================================
     *           LIST
     * ================================ */

    public <T> void listRightPush(String key, T value) {
        redisTemplate.opsForList().rightPush(key, serialize(value));
    }

    public void listTrim(String key, long start, long end) {
        redisTemplate.opsForList().trim(key, start, end);
    }

    public <T> List<T> listRange(String key, long start, long end, Class<T> clazz) {
        List<String> cached = redisTemplate.opsForList().range(key, start, end);

        if (cached == null || cached.isEmpty()) return List.of();

        return cached.stream()
                .map(json -> deserialize(json, clazz))
                .collect(Collectors.toList());
    }

    private String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new GlobalException(GlobalErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private <T> T deserialize(String json, Class<T> clazz) {
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new GlobalException(GlobalErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public Set<String> getZSetReverseRangeByScore(String key, double min, double max, long offset, long cnt) {
        return redisTemplate.opsForZSet().reverseRangeByScore(key, min, max, offset, cnt);

    }
}