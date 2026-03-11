package com.ssafy.be.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.service.ChatService;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StompType;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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
        log.info("--------------------------------------------------\n");
    }

    @Test
    @Order(1)
    @DisplayName("1. 정상 메시지 전송 - Redis 저장 확인")
    void testHandleMessage_savedToRedis() {
        log.info("▶️ [실행] 정상 메시지 전송 및 Redis 저장 테스트");

        // Service가 StompResponse를 반환하므로 타입을 맞춰서 받음
        StompResponse<ChatMessagePayload> response =
                chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "안녕하세요!"));

        // 봉투(Envelope) 타입과 내부 페이로드 검증
        assertThat(response.getEventType()).isEqualTo(StompType.CHAT_MESSAGE);
        assertThat(response.getPayload().content()).isEqualTo("안녕하세요!");

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
    @DisplayName("3. 금칙어 포함 메시지 - '금칙어' 통치환 후 Redis 저장 확인")
    void testFilteredMessage_savedAsBannedWord() {
        int beforeSize = chatService.getRecentMessage(STREAM_ID).size();
        log.info("▶️ [실행] 금칙어 필터링 테스트 (전송 전 메시지 개수: {})", beforeSize);

        // 악의적인 띄어쓰기 및 특수문자 삽입 우회 시도
        String dirtyWord = "아니 진짜 개  새@끼 들이네";

        StompResponse<ChatMessagePayload> response =
                chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, dirtyWord));

        // 검증 1: 정상적인 CHAT_MESSAGE 타입으로 반환되며, 내용은 "금칙어"로 덮어씌워짐
        assertThat(response.getEventType()).isEqualTo(StompType.CHAT_MESSAGE);
        assertThat(response.getPayload().content()).isEqualTo("금칙어");

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        int afterSize = messages.size();

        log.info("🔍 [결과 분석] 금칙어 전송 후 메시지 개수: {}", afterSize);
        log.info("🔍 [결과 분석] 필터링된 내용: {}", messages.get(afterSize - 1).content());

        // 검증 2: 메시지는 버려지지 않고 정상적으로 1개 늘어나야 함
        assertThat(afterSize).isEqualTo(beforeSize + 1);
        assertThat(messages.get(afterSize - 1).content()).isEqualTo("금칙어");
    }

    @Test
    @Order(4)
    @DisplayName("4. 예외 허용어 메시지 - 마스킹 없이 원본 그대로 저장 확인")
    void testAllowedMessage_savedWithoutMasking() {
        log.info("▶️ [실행] 화이트리스트(예외 허용어) 과탐지 방지 테스트");

        // '시발'이라는 금칙어가 포함되어 있지만, '시발점'은 허용어 사전(allowedTrie)에 있음
        String trickyWord = "이번 프로젝트의 시발점은 바로 이것입니다.";

        StompResponse<ChatMessagePayload> response =
                chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, trickyWord));

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        String lastMessage = messages.get(messages.size() - 1).content();

        log.info("🔍 [결과 분석] 허용어 처리된 내용: {}", lastMessage);

        // 검증: "금칙어"로 필터링되지 않고 원본 그대로 통과해야 함
        assertThat(response.getPayload().content()).isEqualTo(trickyWord);
        assertThat(lastMessage).isEqualTo(trickyWord);
    }

    @Test
    @Order(5)
    @DisplayName("5. Redis LTRIM - 100개 초과 시 자동 제거")
    void testChatCacheMaxLimit() {
        log.info("▶️ [실행] Redis LTRIM 100개 한도 초과 테스트");
        for (int i = 1; i <= 100; i++) {
            chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "메시지 " + i));
        }

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        log.info("🔍 [결과 분석] 100개 추가 후 총 메시지 개수: {}", messages.size());

        assertThat(messages).hasSize(100);
        // 1번 테스트에서 넣었던 "안녕하세요!"는 밀려나서 없어야 함
        assertThat(messages.get(0).content()).isNotEqualTo("안녕하세요!");
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
    @DisplayName("8. [부하 테스트] 멀티스레드 동시 접속 및 필터링 안정성 확인")
    void testConcurrentMessages_ThreadSafeAndFiltering() throws InterruptedException {
        int threadCount = 10;
        int messageCount = 100;

        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(messageCount);

        log.info("▶️ [실행] {}개의 스레드에서 {}개의 메시지 동시 전송 (정상 50개, 욕설 50개 믹스)", threadCount, messageCount);

        for (int i = 0; i < messageCount; i++) {
            final int idx = i;
            executorService.submit(() -> {
                try {
                    if (idx % 2 == 0) {
                        chatService.handleMessage(USER_ID, NICKNAME, new ChatMessageRequest(STREAM_ID, "정상적인 소통입니다 " + idx));
                    } else {
                        chatService.handleMessage(USER_ID_2, "악성유저", new ChatMessageRequest(STREAM_ID, "tlqkf 새끼 " + idx));
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executorService.shutdown();

        List<ChatMessagePayload> messages = chatService.getRecentMessage(STREAM_ID);
        log.info("🔍 [결과 분석] 동시성 테스트 후 Redis 저장 개수: {}", messages.size());

        assertThat(messages).hasSize(messageCount);

        long bannedCount = messages.stream()
                .filter(m -> m.content().equals("금칙어"))
                .count();

        log.info("🔍 [결과 분석] 정상적으로 '금칙어'로 치환된 메시지 개수: {}", bannedCount);

        // 절반(50개)은 반드시 "금칙어"로 치환되어야 함
        assertThat(bannedCount).isEqualTo(50);
    }
}