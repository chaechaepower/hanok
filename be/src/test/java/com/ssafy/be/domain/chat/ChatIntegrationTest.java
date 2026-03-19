package com.ssafy.be.domain.chat;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.dto.payload.MacroTemplatePayload;
import com.ssafy.be.domain.chat.dto.request.MacroTemplateRequest;
import com.ssafy.be.domain.chat.exception.MacroErrorCode;
import com.ssafy.be.domain.chat.service.ChatService;
import com.ssafy.be.domain.chat.service.MacroService;
import com.ssafy.be.domain.stream.repository.MacroRedisRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@IntegrationTest
@DisplayName("Chat / Filter / Macro 통합 테스트 (Smoke + Step-up)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class ChatIntegrationTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    // streamId 고정값 (테스트용)
    private static final Long TEST_STREAM_ID = 9999L;

    @Autowired private ChatService chatService;
    @Autowired private MacroService macroService;
    @Autowired private MacroRedisRepository macroRedisRepository;
    @Autowired private StringRedisTemplate redisTemplate;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║          Chat 통합 테스트 Suite 시작                       ║");
        IT_LOG.info("║  Layer  : Service → Filter → Redis                         ║");
        IT_LOG.info("║  시나리오: 총 채팅(I-1~I-3), 필터(I-4~I-5), 매크로(I-6~I-7)║");
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║     Suite 종료  |  총 소요: {}ms{}",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @BeforeEach
    void setUp() {
        // 테스트 전 Redis 초기화
        String chatKey = "chat:stream:" + TEST_STREAM_ID;
        String macroKey = "macro:" + TEST_STREAM_ID;
        redisTemplate.delete(chatKey);
        redisTemplate.delete(macroKey);
    }
    
    @AfterEach
    void tearDown() {
        // 테스트 후 Redis 정리
        String chatKey = "chat:stream:" + TEST_STREAM_ID;
        String macroKey = "macro:" + TEST_STREAM_ID;
        redisTemplate.delete(chatKey);
        redisTemplate.delete(macroKey);
    }

    // ═══ Section 1 : 총 채팅 결합 테스트 ════════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 총 채팅 (General Chat)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class GeneralChatTest {
        @Test
        @Order(1)
        @DisplayName("I-1. 채팅 메시지 전송 및 Redis 리스트 조회 영속성 검증")
        void chat_PersistenceAndRetrieval() {
            IT_LOG.info("    [요청] 채팅 메시지 2개 전송");
            chatService.handleMessage(1L, "userA", TEST_STREAM_ID, new ChatMessageRequest("안녕하세요!"));
            chatService.handleMessage(2L, "userB", TEST_STREAM_ID, new ChatMessageRequest("방송 재밌네요."));

            List<ChatMessagePayload> recents = chatService.getRecentMessage(TEST_STREAM_ID);

            assertThat(recents).hasSize(2);
            assertThat(recents.get(0).content()).isEqualTo("안녕하세요!");
            assertThat(recents.get(1).content()).isEqualTo("방송 재밌네요.");
            
            IT_LOG.info("    [검증] ✔ Redis 리스트 데이터 정상 조회 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 캐시 제한 용량 초과 시 오래된 데이터 삭제 여부 (TRIM)")
        void chat_MaxCapacityTrim() {
            IT_LOG.info("    [요청] 채팅 105개 연속 전송 (한도 100개)");
            for (int i = 1; i <= 105; i++) {
                chatService.handleMessage(1L, "bot", TEST_STREAM_ID, new ChatMessageRequest("msg " + i));
            }

            List<ChatMessagePayload> recents = chatService.getRecentMessage(TEST_STREAM_ID);

            assertThat(recents).hasSize(100);
            assertThat(recents.get(0).content()).isEqualTo("msg 6"); // 가장 오래된 1~5 삭제
            assertThat(recents.get(99).content()).isEqualTo("msg 105");

            IT_LOG.info("    [검증] ✔ 가장 오래된 메시지 삭제 및 최신 100개 유지 확인");
        }
        
        @Test
        @Order(3)
        @DisplayName("I-3. 채팅 키 TTL 자동 갱신 확인")
        void chat_KeyTtlUpdate() {
            IT_LOG.info("    [요청] 채팅 하나 전송 후 Redis TTL 측정");
            chatService.handleMessage(1L, "userA", TEST_STREAM_ID, new ChatMessageRequest("TTL 테스트"));

            Long expireSec = redisTemplate.getExpire("chat:stream:" + TEST_STREAM_ID, TimeUnit.SECONDS);

            assertThat(expireSec).isNotNull();
            assertThat(expireSec).isGreaterThan(7000L); // 7200초 설정 대비 충분히 긴지 확인
            
            IT_LOG.info("    [검증] ✔ 키에 대한 TTL이 정상 부여됨 확인 ({}초)", expireSec);
        }
    }

    // ═══ Section 2 : 필터(BadWordFilter) 결합 테스트 ══════════════
    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 필터(BadWordFilter)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class FilterIntegrationTest {
        @Test
        @Order(1)
        @DisplayName("I-4. ChatService와 필터 모듈 간 통합 파이프라인 무결성")
        void chatFilter_IntegrationValidation() {
            IT_LOG.info("    [요청] 비속어('씨발') 포함 메시지 전송");
            chatService.handleMessage(1L, "userA", TEST_STREAM_ID, new ChatMessageRequest("아 씨발 짜증나게 하네"));

            List<ChatMessagePayload> recents = chatService.getRecentMessage(TEST_STREAM_ID);

            assertThat(recents).hasSize(1);
            assertThat(recents.get(0).content()).isEqualTo("금칙어");

            IT_LOG.info("    [검증] ✔ 서비스 간 결합 후 정상적으로 마스킹된 결과 저장 확인");
        }
        
        @Test
        @Order(2)
        @DisplayName("I-5. 장문의 텍스트 및 중복 비속어 포함 텍스트 성능 및 타임아웃 방어")
        void chatFilter_LongTextPerformance() {
            String longText = "안녕하세요 ".repeat(100) + "씨발 " + "반갑습니다 ".repeat(50);
            IT_LOG.info("    [요청] 매우 긴 길이의 비속어 포함 텍스트 필터 전송");
            
            long start = System.currentTimeMillis();
            chatService.handleMessage(1L, "userA", TEST_STREAM_ID, new ChatMessageRequest(longText));
            long end = System.currentTimeMillis();

            List<ChatMessagePayload> recents = chatService.getRecentMessage(TEST_STREAM_ID);
            assertThat(recents.get(0).content()).isEqualTo("금칙어"); // 전체 금칙어 처리
            assertThat(end - start).isLessThan(500L); // 500ms(0.5초) 안에 완료되는지
            
            IT_LOG.info("    [검증] ✔ 500ms 내 비속어 마스킹 처리 완료 ({}ms) 확인", end - start);
        }
    }

    // ═══ Section 3 : 매크로 결합 테스트 ════════════════════════════
    @Nested
    @Order(3)
    @DisplayName("Section 3 │ 매크로 (Macro)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class MacroIntegrationTest {
        @Test
        @Order(1)
        @DisplayName("I-6. 실제 Redis 적재 데이터 기반 매크로 조회 무결성")
        void macro_validRetrieval() {
            IT_LOG.info("    [준비] 매크로 '환불' -> '반품 불가' 레디스 저장");
            macroRedisRepository.saveAll(TEST_STREAM_ID, Map.of("환불", "반품 불가입니다."));

            IT_LOG.info("    [요청] '환불' 키워드 매크로 호출");
            MacroTemplatePayload payload = macroService.handleMacro(TEST_STREAM_ID, new MacroTemplateRequest("환불"));

            assertThat(payload.questionType()).isEqualTo("환불");
            assertThat(payload.answer()).isEqualTo("반품 불가입니다.");

            IT_LOG.info("    [검증] ✔ 실제 Redis 레포지토리를 통한 조회 결합 확인");
        }
        
        @Test
        @Order(2)
        @DisplayName("I-7. 빈 Redis 환경에서 조회 시 예외 처리 연쇄 흐름")
        void macro_notFoundThrowsException() {
            IT_LOG.info("    [요청] 레디스에 없는 '배송' 키워드 매크로 조회");

            GlobalException exception = assertThrows(GlobalException.class, () -> {
                macroService.handleMacro(TEST_STREAM_ID, new MacroTemplateRequest("배송"));
            });

            assertThat(exception.getErrorCode()).isEqualTo(MacroErrorCode.MACRO_NOT_FOUND);

            IT_LOG.info("    [검증] ✔ DB 미존재 키 접근 시 MACRO_NOT_FOUND 예외 정상 발생");
        }
    }
}
