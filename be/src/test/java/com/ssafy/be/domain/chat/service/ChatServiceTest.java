package com.ssafy.be.domain.chat.service;

import com.ssafy.be.domain.chat.filter.BadWordFilter;
import com.ssafy.be.global.extension.TestReportExtension;
import com.ssafy.be.global.infra.redis.RedisOperator;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.filter.ChatFilterResult;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class ChatServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks
    ChatService chatService;

    @Mock
    BadWordFilter badWordFilter;

    @Mock
    RedisOperator redisOperator;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       ChatService 단위 테스트 Suite 시작                 ║");
        TEST_LOG.info("║  Layer   : Service                                       ║");
        TEST_LOG.info("║  Mock    : BadWordFilter, RedisOperator                  ║");
        TEST_LOG.info("║  시나리오: S-1 ~ S-4  (2 Group)                          ║");
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

    // ═══ Group 1 : 예외 검증 (Step-up) ═══════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Group 1 │ 예외 및 엣지 케이스 처리 (Step-up)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class Validation {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 1 │ 예외 검증");
            TEST_LOG.info("│  검증 목표: Redis 통신 장애 또는 요청 값 엣지 케이스 검증");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-1. (Optional) Redis 예외 발생 시 전파되는지 확인")
        void handleMessage_redisError_throwsException() {
            TEST_LOG.info("    [진행] RedisOperator 에러 상황 강제 유도 (Mock)");
            
            ChatMessageRequest request = new ChatMessageRequest("Hello");
            given(badWordFilter.filter("Hello"))
                    .willReturn(ChatFilterResult.builder().isDetected(false).maskedText("Hello").build());
            
            doThrow(new RuntimeException("Redis Error"))
                    .when(redisOperator).listRightPush(anyString(), any());
                    
            assertThrows(RuntimeException.class, 
                    () -> chatService.handleMessage(1L, "user", 1L, request));
            
            TEST_LOG.info("    [검증] ✔ RuntimeException 전파 확인");
        }
    }

    // ═══ Group 2 : 정상 흐름 (Smoke) ═══════════════════════════
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
            TEST_LOG.info("│  검증 목표: 메시지가 필터를 거쳐 정상적으로 Redis에 저장되는지 확인");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-2. 채팅 메시지 전달 시 필터 거쳐 Redis 저장 후 Payload 반환")
        void handleMessage_validInput_savesToRedisAndReturnsPayload() {
            TEST_LOG.info("    [진행] 정상적인 ChatMessageRequest 입력 (필터 통과)");
            
            ChatMessageRequest request = new ChatMessageRequest("금칙어테스트");
            given(badWordFilter.filter("금칙어테스트"))
                    .willReturn(ChatFilterResult.builder().isDetected(true).maskedText("금칙어").build());

            ChatMessagePayload result = chatService.handleMessage(1L, "user1", 1L, request);

            assertThat(result.content()).isEqualTo("금칙어");
            
            verify(redisOperator, times(1)).listRightPush(eq("chat:stream:1"), any(ChatMessagePayload.class));
            verify(redisOperator, times(1)).listTrim(eq("chat:stream:1"), eq(-100L), eq(-1L));
            verify(redisOperator, times(1)).setExpire(eq("chat:stream:1"), eq(7200L), eq(TimeUnit.SECONDS));
            
            TEST_LOG.info("    [검증] ✔ 마스킹된 페이로드 반환 및 Redis 연산 모두 호출 확인");
        }

        @Test
        @Order(2)
        @DisplayName("S-3. 특정 Stream의 채팅 목록 정상 조회")
        void getRecentMessage_returnsChatList() {
            TEST_LOG.info("    [진행] getRecentMessage(streamId) 호출");
            
            given(redisOperator.listRange("chat:stream:1", 0, -1, ChatMessagePayload.class))
                    .willReturn(List.of());
                    
            List<ChatMessagePayload> list = chatService.getRecentMessage(1L);
            
            assertThat(list).isNotNull();
            verify(redisOperator, times(1)).listRange("chat:stream:1", 0, -1, ChatMessagePayload.class);
            
            TEST_LOG.info("    [검증] ✔ Redis 목록 조회 위임 확인");
        }

        @Test
        @Order(3)
        @DisplayName("S-4. 채팅 캐시 정상 삭제")
        void deleteChat_removesRedisKey() {
            TEST_LOG.info("    [진행] deleteChat(streamId) 호출");
            
            chatService.deleteChat(1L);
            
            verify(redisOperator, times(1)).delete("chat:stream:1");
            
            TEST_LOG.info("    [검증] ✔ Redis 삭제 위임 확인");
        }
    }
}
