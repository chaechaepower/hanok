package com.ssafy.be.global.websocket.intercepter;

import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import io.jsonwebtoken.Claims;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;
    private final JsonConverter jsonConverter;

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String BLACKLIST_PREFIX = "blacklist:";

    // null처리 강화
    @Override
    @Nullable
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message, StompHeaderAccessor.class
        );

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        // CONNECT
        if (StompCommand.CONNECT.equals(command)) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            // 비로그인 사용자도 connect 가능하도록 허용. guestId는 음수로 지정
            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                long guestId = -Math.abs(UUID.randomUUID().getMostSignificantBits());

                guestId = guestId == 0L ? -1L : guestId;

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(String.valueOf(guestId), null, List.of());

                accessor.setUser(authentication);
                return message;
            }

            String token = authHeader.substring(BEARER_PREFIX.length());

            if (redisService.exists(BLACKLIST_PREFIX + token)) {
                throw new MessageDeliveryException("로그아웃된 토큰입니다");
            }

            Claims claims = jwtUtil.validateToken(token);
            String userId = claims.getSubject();
            String nickname = claims.get("nickname", String.class);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, List.of());
            authentication.setDetails(nickname);

            accessor.setUser(authentication);
            return message;
        }

        // SUBSCRIBE는 비로그인, 로그인 상관없이 모두 가능
        if (StompCommand.SUBSCRIBE.equals(command)) {
            return message;
        }

        // SEND
        if (StompCommand.SEND.equals(command)) {
            Long userId = extractUserId(accessor.getUser());

            if (userId == null) {
                throw new MessageDeliveryException("유효한 사용자 세션이 필요합니다");
            }

            if (userId < 0) { // 게스트인 경우
                StreamEventType eventType = jsonConverter.convert(message.getPayload(), StompRequest.class).getEventType();

                if (eventType == null || !eventType.isGuestSendAllowedEventType()) {
                    throw new MessageDeliveryException("게스트는 허용된 이벤트만 전송할 수 있습니다");
                }
            }
        }

        return message;
    }

    private Long extractUserId(Principal principal) {
        if (principal == null) {
            return null;
        }
        return Long.parseLong(principal.getName());
    }
}



