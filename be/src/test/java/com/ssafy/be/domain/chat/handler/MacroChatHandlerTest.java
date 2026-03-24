package com.ssafy.be.domain.chat.handler;

import com.ssafy.be.domain.chat.dto.payload.MacroTemplatePayload;
import com.ssafy.be.domain.chat.dto.request.MacroTemplateRequest;
import com.ssafy.be.domain.chat.service.MacroService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.extension.TestReportExtension;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("MacroChatHandler 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class MacroChatHandlerTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks MacroChatHandler macroChatHandler;
    @Mock MacroService macroService;
    @Mock JsonConverter jsonConverter;
    @Mock StreamPublisher streamPublisher;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       MacroChatHandler 단위 테스트 Suite 시작            ║");
        TEST_LOG.info("║  Layer   : Handler (WebSocket)                           ║");
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

    @Nested @Order(1)
    @DisplayName("Group 1 │ 이벤트 타입")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class EventType {

        @Test @Order(1)
        @DisplayName("M-1. getEventType() → MACRO_TEMPLATE 반환")
        void getEventType_returnsMacroTemplate() {
            assertThat(macroChatHandler.getEventType()).isEqualTo(StreamEventType.MACRO_TEMPLATE);
            TEST_LOG.info("    [검증] ✔ StreamEventType.MACRO_TEMPLATE 확인");
        }
    }

    @Nested @Order(2)
    @DisplayName("Group 2 │ handle() 정상 흐름")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class HandleHappyPath {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ handle() 정상 흐름");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("M-2. handle() → macroService.handleMacro() + streamPublisher.sendToUser() 각 1회")
        void handle_delegatesToServiceAndPublisher() {
            Long streamId = 1L;
            Long userId   = 42L;

            // MacroTemplateRequest: record(questionType)
            StompRequest<String> request = new StompRequest<>(StreamEventType.MACRO_TEMPLATE, "{}");
            MacroTemplateRequest macroReq = new MacroTemplateRequest("GREETING");
            MacroTemplatePayload responsePayload = MacroTemplatePayload.builder().build();

            UsernamePasswordAuthenticationToken principal =
                    new UsernamePasswordAuthenticationToken(String.valueOf(userId), null);

            given(jsonConverter.convert(any(), eq(MacroTemplateRequest.class))).willReturn(macroReq);
            given(macroService.handleMacro(eq(streamId), eq(macroReq))).willReturn(responsePayload);

            macroChatHandler.handle(request, streamId, principal);

            verify(macroService, times(1)).handleMacro(eq(streamId), eq(macroReq));
            verify(streamPublisher, times(1)).sendToUser(
                    eq(userId), eq(streamId), eq(StreamEventType.MACRO_TEMPLATE), eq(responsePayload));

            TEST_LOG.info("    [검증] ✔ macroService.handleMacro() → 1회 호출");
            TEST_LOG.info("    [검증] ✔ streamPublisher.sendToUser(MACRO_TEMPLATE) → 1회 호출");
        }
    }
}
