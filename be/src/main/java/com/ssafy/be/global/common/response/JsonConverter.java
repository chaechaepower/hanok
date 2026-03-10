package com.ssafy.be.global.common.response;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Objects;


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
}
