package com.ssafy.be.domain.chat.service;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.filter.BadWordFilter;
import com.ssafy.be.domain.chat.filter.ChatFilterResult;
import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final BadWordFilter badWordFilter;
    private final RedisOperator redisOperator;

    private static final long CHAT_MAX = 100L;
    private static final long CHAT_TTL_SECOND = 7200L;

    public ChatMessagePayload handleMessage(Long userId, String nickname, Long streamId, ChatMessageRequest request) {
        ChatFilterResult filterResult = badWordFilter.filter(request.content());

        ChatMessagePayload payload = buildChatPayload(userId, nickname, streamId, filterResult.maskedText());

        saveToRedis(streamId, payload);

        return payload;
    }


    public List<ChatMessagePayload> getRecentMessage(Long streamId) {
        return redisOperator.listRange(chatKey(streamId), 0, -1, ChatMessagePayload.class);
    }

    public void deleteChat(Long streamId) {
        redisOperator.delete(chatKey(streamId));
    }

    // ---------- private ----------

    private ChatMessagePayload buildChatPayload(Long userId, String nickname, Long streamId, String content) {
        return ChatMessagePayload.builder()
                .streamId(streamId)
                .userId(userId)
                .nickname(nickname)
                .content(content) // 마스킹된 내용이 들어감
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void saveToRedis(Long streamId, ChatMessagePayload payload) {
        String key = chatKey(streamId);
        redisOperator.listRightPush(key, payload);
        redisOperator.listTrim(key, -CHAT_MAX, -1);
        redisOperator.setExpire(key, CHAT_TTL_SECOND, TimeUnit.SECONDS);
    }

    private String chatKey(Long streamId) {
        return "chat:stream:" + streamId;
    }

}