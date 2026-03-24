package com.ssafy.be.domain.chat.handler;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.service.ChatService;
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
@DisplayName("ChatMessageHandler 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class ChatMessageHandlerTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks ChatMessageHandler chatMessageHandler;
    @Mock ChatService chatService;
    @Mock JsonConverter jsonConverter;
    @Mock StreamPublisher streamPublisher;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       ChatMessageHandler 단위 테스트 Suite 시작          ║");
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
        @DisplayName("H-1. getEventType() → CHAT_MESSAGE 반환")
        void getEventType_returnsChatMessage() {
            TEST_LOG.info("    [진행] getEventType() 호출");
            assertThat(chatMessageHandler.getEventType()).isEqualTo(StreamEventType.CHAT_MESSAGE);
            TEST_LOG.info("    [검증] ✔ StreamEventType.CHAT_MESSAGE 확인");
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
            TEST_LOG.info("│  검증 목표: chatService + streamPublisher 각 1회 위임 보장");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("H-2. handle() → chatService.handleMessage() + streamPublisher.broadcast() 각 1회")
        void handle_delegatesToServiceAndPublisher() {
            Long streamId = 1L;
            Long userId   = 42L;
            String nickname = "테스트유저";

            // StompRequest: @AllArgsConstructor(eventType, payload)
            StompRequest<String> request = new StompRequest<>(StreamEventType.CHAT_MESSAGE, "{}");
            ChatMessageRequest chatReq = new ChatMessageRequest("안녕하세요");
            ChatMessagePayload payload = ChatMessagePayload.builder()
                    .userId(userId).nickname(nickname).content("안녕하세요").build();

            UsernamePasswordAuthenticationToken principal = new UsernamePasswordAuthenticationToken(
                    String.valueOf(userId), null);
            principal.setDetails(nickname);

            given(jsonConverter.convert(any(), eq(ChatMessageRequest.class))).willReturn(chatReq);
            given(chatService.handleMessage(eq(userId), eq(nickname), eq(streamId), eq(chatReq)))
                    .willReturn(payload);

            TEST_LOG.info("    [진행] handle() 호출 (streamId={}, userId={})", streamId, userId);
            chatMessageHandler.handle(request, streamId, principal);

            verify(chatService, times(1)).handleMessage(eq(userId), eq(nickname), eq(streamId), eq(chatReq));
            verify(streamPublisher, times(1)).broadcast(eq(streamId), eq(StreamEventType.CHAT_MESSAGE), eq(payload));

            TEST_LOG.info("    [검증] ✔ chatService.handleMessage() → 1회 호출");
            TEST_LOG.info("    [검증] ✔ streamPublisher.broadcast(CHAT_MESSAGE) → 1회 호출");
        }
    }
}
