package com.ssafy.be.global.common.response;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Objects;


@Slf4j
@Component
@RequiredArgsConstructor
public class JsonConverter {

    private final ObjectMapper objectMapper;

    /**
     * Object -> JSON String
     */
    public String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("JSON 직렬화에 실패했습니다.", e);
        }
    }

    /**
     * JSON String -> Object
     */
    public <T> T fromJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("JSON 역직렬화에 실패했습니다.", e);
        }
    }

    /**
     * Object (Map, JSON String 등) -> Target Type
     */
    public <T> T convert(Object value, Class<T> type) {
        if (value instanceof String str) {
            return fromJson(str, type);
        }
        return objectMapper.convertValue(value, type);
    }

    /**
     * Object -> Redis Hash
     */
    public <T> Map<String, String> toHash(T object) {
        Map<String, String> map = objectMapper.convertValue(
                object,
                new TypeReference<Map<String, String>>() {}
        );

        // StringRedisTemplate는 null 허용 X
        map.values().removeIf(Objects::isNull);

        return map;
    }

    /**
     * Redis Hash -> Object
     */
    public <T> T fromHash(Map<Object, Object> hash, Class<T> clazz) {
        return objectMapper.convertValue(hash, clazz);
    }

    /**
     * {@code Map<String, Object>} → JSON 문자열. {@code null}이거나 비어 있으면 {@code null}
     * (예: Redis Hash 등에서 선택 필드로 저장할 때).
     */
    public String toJsonOrNullIfEmpty(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        return toJson(map);
    }

    /**
     * JSON 문자열 → {@code Map<String, Object>}. {@code null}/공백이면 빈 맵.
     * 역직렬화 실패 시에도 예외 대신 빈 맵을 반환하고 경고 로그만 남긴다 (구버전·손상 데이터 등).
     */
    public Map<String, Object> fromJsonToMapOrEmpty(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.warn("JSON → Map 역직렬화 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
