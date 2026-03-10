package com.ssafy.be.domain.chat.service;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.payload.FilteredPayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.filter.ChatFilter;
import com.ssafy.be.domain.chat.publisher.ChatPublisher;
import com.ssafy.be.global.infra.redis.RedisOperator;
import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StompType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatPublisher chatPublisher;
    private final ChatFilter chatFilter;
    private final RedisOperator redisOperator;


    private static final long CHAT_MAX = 100L;
    private static final long CHAT_TTL_SECOND = 7200L;

    public Optional<StompResponse<?>> handleMessage(Long userId, String nickname, ChatMessageRequest request) {

        if(chatFilter.isFiltered(request.content())) {
            chatPublisher.sendToUser(userId, StompType.CHAT_FILTERED,
                    buildFilteredPayload());
            return Optional.empty();
        }

        ChatMessagePayload payload = buildChatPayload(userId, nickname, request);
        saveToRedis(request.streamId(), payload);
        return Optional.of(toStompResponse(StompType.CHAT_MESSAGE, payload));
    }

    public List<ChatMessagePayload> getRecentMessage(Long streamId) {
        return redisOperator.listRange(chatKey(streamId), 0, -1, ChatMessagePayload.class);
    }


    public void deleteChat(Long streamId) {
        redisOperator.delete(chatKey(streamId));
    }


    //---------- private---------------------------------------

    private ChatMessagePayload buildChatPayload(Long userId, String nickname, ChatMessageRequest request) {
        return ChatMessagePayload.builder()
                .streamId(request.streamId())
                .userId(userId)
                .nickname(nickname)
                .content(request.content())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private FilteredPayload buildFilteredPayload() {
        return FilteredPayload.builder()
                .reason("금칙어가 포함된 채팅입니다")
                .detectedAt(LocalDateTime.now())
                .build();
    }

    private void saveToRedis(Long streamId, ChatMessagePayload payload) {
        String key = chatKey(streamId);
        redisOperator.listRightPush(key, payload);
        redisOperator.listTrim(key, -CHAT_MAX,  -1);
        redisOperator.setExpire(key, CHAT_TTL_SECOND, TimeUnit.SECONDS);
    }

    private String chatKey(Long streamId) { return "chat:stream:" + streamId; }


    private <T> StompResponse<T> toStompResponse(StompType stompType, T payload) {
        return StompResponse.<T>builder()
                .eventType(stompType)
                .payload(payload)
                .build();
    }

}
