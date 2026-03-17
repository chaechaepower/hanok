package com.ssafy.be.global.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.global.exception.ErrorResponse;
import com.ssafy.be.global.exception.GlobalErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    // 호출 조건:
    //   1. 요청에 토큰이 없는 경우 (익명 유저가 인증 필요 리소스 접근)
    //   2. 토큰이 유효하지 않아 JwtAuthenticationFilter에서 SecurityContext를 비운 경우
    //   3. AccessDeniedException이 발생했지만 유저가 익명(anonymous)인 경우
    //      → ExceptionTranslationFilter가 "인증 먼저 하세요"로 판단해 여기로 위임
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        // 1. 응답 상태 코드를 401 Unauthorized로 설정
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // 2. 응답 Content-Type을 JSON으로 설정 (Filter 단이므로 MVC 자동변환 불가)
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // 3. 공통 에러 응답 객체 생성 (GlobalErrorCode.UNAUTHORIZED → 401 + 에러 메시지)
        ErrorResponse errorResponse = ErrorResponse.from(GlobalErrorCode.UNAUTHORIZED);

        // 4. ObjectMapper로 직접 직렬화 후 응답 스트림에 작성
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
