package com.ssafy.be.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.service.ChatService;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.support.annotation.IntegrationTest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
@IntegrationTest
@AutoConfigureMockMvc(addFilters = false)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ChatIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ChatService chatService;
    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private ObjectMapper objectMapper;

    // 외부 연동 API가 있다면 Mocking 처리
    @MockitoBean
    private PortoneClient portoneClient;

    private static final Long   STREAM_ID  = 1L;
    private static final Long   USER_ID    = 100L;
    private static final Long   USER_ID_2  = 200L;
    private static final String NICKNAME   = "테스트유저";
    private static final String CHAT_KEY   = "chat:stream:" + STREAM_ID;

    @BeforeAll
    void setUp() {
        redisTemplate.delete(CHAT_KEY);
        log.info("🚀 [테스트 시작] Redis CHAT_KEY 초기화 완료");
    }

    @AfterEach
    void printPassLog(TestInfo testInfo) {
        log.info("✅ [PASS] {}", testInfo.getDisplayName());
        log.info("--------------------------------------------------");
    }

    @Test
    @Order(1)
    @DisplayName("1. 채팅 메시지 전송 - Redis 저장 확인")
    void testHandleMessage_savedToRedis() {
        log.info("▶️ [실행] 메시지 전송 및 Redis 저장 테스트");
        chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "안녕하세요!"));

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        log.info("🔍 [결과 분석] Redis에 저장된 메시지 개수: {}", messages.size());

        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).content()).isEqualTo("안녕하세요!");
    }

    @Test
    @Order(2)
    @DisplayName("2. [GET] /api/v1/streams/{streamId}/chat - 채팅 히스토리 조회")
    void testGetChatHistory() throws Exception {
        log.info("▶️ [실행] REST API를 통한 채팅 히스토리 조회 테스트");
        chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "두 번째 메시지"));

        mockMvc.perform(get("/api/v1/streams/{streamId}/chat", STREAM_ID)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @Order(3)
    @DisplayName("3. Redis LTRIM - 100개 초과 시 자동 제거")
    void testChatCacheMaxLimit() {
        log.info("▶️ [실행] Redis LTRIM 100개 한도 초과 테스트 (현재까지 2개 존재)");
        for (int i = 1; i <= 100; i++) {
            chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "메시지 " + i));
        }

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        log.info("🔍 [결과 분석] 100개 추가 후 총 메시지 개수: {}", messages.size());

        assertThat(messages).hasSize(100); // 102개가 아니라 100개여야 함
        assertThat(messages.get(0).content()).isNotEqualTo("안녕하세요!"); // 가장 오래된 데이터는 삭제되어야 함
    }

    @Test
    @Order(4)
    @DisplayName("4. 금칙어 포함 메시지 - Redis에 저장되지 않아야 함")
    void testFilteredMessage_notSavedToRedis() {
        int beforeSize = chatService.getRecentMessage(STREAM_ID).size();
        log.info("▶️ [실행] 금칙어 필터링 테스트 (전송 전 메시지 개수: {})", beforeSize);

        chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, " 포함 메시지"));

        int afterSize = chatService.getRecentMessage(STREAM_ID).size();
        log.info("🔍 [결과 분석] 금칙어 전송 후 메시지 개수: {}", afterSize);

        assertThat(afterSize).isEqualTo(beforeSize);
    }

    @Test
    @Order(5)
    @DisplayName("5. 정상 메시지 - 필터 통과 후 Redis 저장 확인")
    void testNormalMessage_savedToRedis() {
        int beforeSize = chatService.getRecentMessage(STREAM_ID).size();
        log.info("▶️ [실행] 정상 메시지 전송 테스트 (전송 전 개수: {})", beforeSize);

        chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "정상적인 채팅입니다"));

        int afterSize = chatService.getRecentMessage(STREAM_ID).size();
        log.info("🔍 [결과 분석] 정상 메시지 전송 후 개수: {}", afterSize);

        // 주의: 만약 limit 설정이 100개라면 beforeSize가 이미 100일 경우
        // 1개를 넣어도 가장 오래된 것이 지워지므로 afterSize도 100입니다.
        if (beforeSize == 100) {
            assertThat(afterSize).isEqualTo(100);
        } else {
            assertThat(afterSize).isEqualTo(beforeSize + 1);
        }
    }

    @Test
    @Order(6)
    @DisplayName("6. 빈 채팅 히스토리 조회")
    void testGetChatHistory_emptyStream() throws Exception {
        log.info("▶️ [실행] 데이터가 없는 스트림 ID 조회 테스트");
        Long nonExistStreamId = 999L;

        mockMvc.perform(get("/api/v1/streams/{streamId}/chat", nonExistStreamId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @Order(7)
    @DisplayName("7. [DELETE] 방송 종료 시 캐시 삭제")
    void testClearChat() throws Exception {
        log.info("▶️ [실행] 채팅 캐시 완전 삭제(DELETE) 테스트");

        mockMvc.perform(delete("/api/v1/streams/{streamId}/chat", STREAM_ID))
                .andDo(print())
                .andExpect(status().isOk());

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        log.info("🔍 [결과 분석] 캐시 삭제 후 Redis 남은 개수: {}", messages.size());

        assertThat(messages).isEmpty();
        assertThat(redisTemplate.hasKey(CHAT_KEY)).isFalse();
    }

    @Test
    @Order(8)
    @DisplayName("8. 여러 유저 채팅 메시지 순서 보장 확인")
    void testMultipleUsers_messageOrder() {
        log.info("▶️ [실행] 여러 유저 메시지 순서 확인 테스트 (기존 데이터 지워진 상태에서 시작)");
        chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "유저1 메시지"));
        chatService.handleMessage(USER_ID_2, "테스트유저2", new ChatMessageRequest(STREAM_ID, "유저2 메시지"));
        chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "유저1 두번째"));

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        log.info("🔍 [결과 분석] 다중 유저 메시지 개수: {}, 3번째 메시지: {}", messages.size(), messages.get(2).content());

        assertThat(messages).hasSize(3);
        assertThat(messages.get(0).userId()).isEqualTo(USER_ID);
        assertThat(messages.get(1).userId()).isEqualTo(USER_ID_2);
        assertThat(messages.get(2).content()).isEqualTo("유저1 두번째");
    }
}