package com.ssafy.be.domain.follow.controller;

import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.service.FollowService;
import com.ssafy.be.global.extension.TestReportExtension;
import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        value = FollowController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("FollowController 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
@ExtendWith(TestReportExtension.class)
@org.springframework.context.annotation.Import(FollowControllerTest.MockMvcConfig.class)
class FollowControllerTest {

    @org.springframework.boot.test.context.TestConfiguration
    static class MockMvcConfig implements org.springframework.web.servlet.config.annotation.WebMvcConfigurer {
        @Override
        public void addArgumentResolvers(java.util.List<org.springframework.web.method.support.HandlerMethodArgumentResolver> resolvers) {
            resolvers.add(new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver());
        }
    }

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");

    @Autowired MockMvc mockMvc;
    @MockitoBean
    FollowService followService;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean
    RedisService redisService;

    @BeforeEach
    void setUp() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "1", null, Collections.emptyList());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("C-1. 팔로우 토글 정상 호출 → 200 OK + Service 위임 확인")
    void toggleFollow_Returns200() throws Exception {
        TEST_LOG.info("    [요청] POST /api/v1/follow/10");

        FollowResponse mockResponse = FollowResponse.builder().following(true).build();
        given(followService.toggleFollow(1L, 10L)).willReturn(mockResponse);

        mockMvc.perform(post("/api/v1/follow/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.following").value(true));

        verify(followService, times(1)).toggleFollow(1L, 10L);
        TEST_LOG.info("    [검증] ✔ 200 OK 및 $.following: true 정상 매핑 확인");
        TEST_LOG.info("    [해소] Controller -> Service 연동 계약 이상 없음");
    }
}
