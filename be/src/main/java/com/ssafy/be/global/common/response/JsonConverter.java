package com.ssafy.be.global.common.response;


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

    //model to map
    public <T> Map<String, String> toHash(T object) {
        // Jackson을 이용해 1차 변환
        Map<String, String> map = objectMapper.convertValue(object, new TypeReference<Map<String, String>>() {});

        // StringRedisTemplate는 null 허용X -> 삭제
        map.values().removeIf(Objects::isNull);

        return map;
    }

    //map to hash
    public <T> T fromHash(Map<Object,Object> hash, Class<T> clazz) {
        return objectMapper.convertValue(hash,clazz);
    }
}
