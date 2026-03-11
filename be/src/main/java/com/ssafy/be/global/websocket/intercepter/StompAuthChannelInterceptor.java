package com.ssafy.be.global.websocket.intercepter;

import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String BLACKLIST_PREFIX = "blacklist:";

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message, StompHeaderAccessor.class
        );


        if(StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if(authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                throw new MessageDeliveryException("Authentication 헤더가 없습니다");
            }

            String token = authHeader.substring(BEARER_PREFIX.length());

            if(redisService.exists(BLACKLIST_PREFIX + token)) {
                throw new MessageDeliveryException("로그아웃된 토큰입니다");
            }

            Claims claims = jwtUtil.validateToken(token);
            String userId = claims.getSubject();
            String nickname = claims.get("nickname",String.class);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, List.of());
            authentication.setDetails(nickname);

            accessor.setUser(authentication);
        }

        return message;
    }

}
