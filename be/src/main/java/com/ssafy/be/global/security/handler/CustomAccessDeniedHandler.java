package com.ssafy.be.global.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.global.exception.ErrorResponse;
import com.ssafy.be.global.exception.GlobalErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    // 호출 조건:
    //   1. 인증은 완료된 유저(SecurityContext에 Authentication 존재)가
    //      접근 권한이 없는 리소스에 요청한 경우 (role/authority 불일치)
    //   → ExceptionTranslationFilter가 "권한 없음"으로 판단해 여기로 위임
    //   익명 유저의 AccessDeniedException은 여기 오지 않고
    //      AuthenticationEntryPoint로 라우팅됨
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        // 1. 응답 상태 코드를 403 Forbidden으로 설정
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        // 2. 응답 Content-Type을 JSON으로 설정 (Filter 단이므로 MVC 자동변환 불가)
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // 3. 공통 에러 응답 객체 생성 (GlobalErrorCode.FORBIDDEN → 403 + 에러 메시지)
        ErrorResponse errorResponse = ErrorResponse.from(GlobalErrorCode.DENIED_HANDLER_ERROR);

        // 4. ObjectMapper로 직접 직렬화 후 응답 스트림에 작성
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
