package com.ssafy.be.domain.chat.controller;

import com.ssafy.be.domain.chat.service.ChatService;
import com.ssafy.be.global.extension.TestReportExtension;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        value = ChatController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ChatController 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class ChatControllerTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ChatService chatService;

    @MockitoBean
    JwtUtil jwtUtil;

    @MockitoBean
    RedisService redisService;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       ChatController 단위 테스트 Suite 시작              ║");
        TEST_LOG.info("║  Layer   : Controller (MockMvc)                          ║");
        TEST_LOG.info("║  Mock    : ChatService                                   ║");
        TEST_LOG.info("║  시나리오: C-1 ~ C-4  (2 Group)                          ║");
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║     Suite 종료  |  총 소요: {}ms{}║",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    // ═══ Group 1 : 입력값 Validation ═══════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Group 1 │ 입력값 Validation (Step-up)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class Validation {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 1 │ 입력값 Validation");
            TEST_LOG.info("│  검증 목표: 유효하지 않은 파라미터(Stream ID 형식 등) → 400");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("C-1. Stream ID 형식 오류 (문자열 등) 전달 시 → 400 Bad Request")
        void getChatHistory_invalidStreamId_returns400() throws Exception {
            TEST_LOG.info("    [요청] GET /api/v1/streams/invalid-id/chat");
            
            mockMvc.perform(get("/api/v1/streams/invalid-id/chat"))
                    .andExpect(status().isBadRequest());
                    
            TEST_LOG.info("    [검증] ✔ 400 Bad Request 확인");
            TEST_LOG.info("    [해소] PathVariable 타입 불일치 방어");
        }
    }

    // ═══ Group 2 : 정상 흐름 ════════════════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Group 2 │ 정상 흐름 (Smoke)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class HappyPath {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ 정상 흐름");
            TEST_LOG.info("│  검증 목표: 올바른 Stream ID 요청 → 200 + ChatService 위임");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("C-2. 유효한 Stream ID 로 채팅 내역 조회 → 200 응답 + Service 위임")
        void getChatHistory_validStreamId_returns200() throws Exception {
            TEST_LOG.info("    [요청] GET /api/v1/streams/1/chat");
            
            given(chatService.getRecentMessage(1L)).willReturn(List.of());

            mockMvc.perform(get("/api/v1/streams/1/chat"))
                    .andExpect(status().isOk());

            verify(chatService, times(1)).getRecentMessage(1L);
            
            TEST_LOG.info("    [검증] ✔ 200 OK + Service 위임 확인");
            TEST_LOG.info("    [해소] Controller → Service 위임 계약 보장");
        }

        @Test
        @Order(2)
        @DisplayName("C-3. 채팅 내역 삭제 요청 → 200 응답 + Service 위임")
        void clearChat_validStreamId_returns200() throws Exception {
            TEST_LOG.info("    [요청] DELETE /api/v1/streams/1/chat");
            
            mockMvc.perform(delete("/api/v1/streams/1/chat"))
                    .andExpect(status().isOk());
                    
            verify(chatService, times(1)).deleteChat(1L);
            
            TEST_LOG.info("    [검증] ✔ 200 OK + Service 위임 확인");
            TEST_LOG.info("    [해소] 채팅 캐시 삭제 위임 동작 확인");
        }
    }
}
