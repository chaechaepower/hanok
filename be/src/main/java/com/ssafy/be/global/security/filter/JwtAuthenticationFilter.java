package com.ssafy.be.global.security.filter;

import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;

    private static final String BLACKLIST_PREFIX = "blacklist:";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        System.out.println("요청 URI 및 메서드: " + request.getRequestURI() + " [" + request.getMethod() + "]");
        System.out.println("들어온 헤더: " + request.getHeader("Authorization"));

        String token = jwtUtil.resolveToken(request);

        if (token != null) {
            try {
                // 블랙리스트 체크 (로그아웃된 토큰 차단)
                if (redisService.exists(BLACKLIST_PREFIX + token)) {
                    SecurityContextHolder.clearContext();
                    // 차단 시 바로 401 에러를 내려주고 리턴해야 합니다.
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Logged out token");
                    return;
                }

                Claims claims = jwtUtil.validateToken(token);

                // 1. 토큰 Claim에서 "role"을 꺼내어 권한 객체로 변환
                String role = claims.get("role", String.class);
                List<org.springframework.security.core.authority.SimpleGrantedAuthority> authorities =
                        (role != null) ? List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(role)) : List.of();

                // 2. 권한 목록을 포함하여 Authentication 생성
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                claims.getSubject(),
                                null,
                                authorities
                        );

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (JwtException | IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
                // 3. 예외가 터졌을 때도 컨트롤러로 넘기지 말고 여기서 바로 차단
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\": \"유효하지 않거나 만료된 토큰입니다.\"}");
                return; // 필터 체인 종료
            }
        }
        filterChain.doFilter(request, response);
    }
}