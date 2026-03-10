package com.ssafy.be.domain.notification.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.Storage;
import com.ssafy.be.domain.notification.model.NotificationRedisKeys;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.support.annotation.IntegrationTest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
@IntegrationTest
@AutoConfigureMockMvc(addFilters = false)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class NotificationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private NotificationService notificationService;
    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private SellerRepository sellerRepository;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private PortoneClient portoneClient;
    @MockitoBean private Storage storage;

    private static final Long MY_USER_ID = 1L;
    private static final Long HACKER_ID  = 999L;

    private Long targetNotifId;

    // ✅ SecurityContext에 principal 주입 — JWT 필터가 하던 역할을 대신
    private void setAuth(Long userId) {
        var auth = new UsernamePasswordAuthenticationToken(
                String.valueOf(userId), null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @BeforeAll
    void setUp() {
        log.info("========== [TEST SETUP] 테스트 환경 초기화 시작 ==========");
        setAuth(MY_USER_ID); // ✅ sendNotification 전에 principal 세팅
        redisTemplate.delete(NotificationRedisKeys.getUserInboxKey(MY_USER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserUnreadKey(MY_USER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserInboxKey(HACKER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserUnreadKey(HACKER_ID));

        for (int i = 1; i <= 15; i++) {
            notificationService.sendNotification(
                    MY_USER_ID, "test", "알림 " + i, "내용 " + i, "/url/" + i
            );
        }
        log.info("▶ [완료] 테스트용 알림 15개 발송 완료");
        log.info("========================================================\n");
    }

    @BeforeEach
    void setDefaultAuth() {
        setAuth(MY_USER_ID); // ✅ 각 테스트 시작 시 기본 유저로 초기화
    }

    @AfterEach
    void tearDown(TestInfo testInfo) {
        SecurityContextHolder.clearContext(); // ✅ 테스트 간 컨텍스트 오염 방지
        log.info("✅ [PASS] {}", testInfo.getDisplayName());
        log.info("--------------------------------------------------");
    }

    // ────────────────────────────────────────────────────────────
    // Order 1: 커서 기반 알림 목록 페이징 조회
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(1)
    @DisplayName("1. [GET] 커서 기반 알림 목록 페이징 검증")
    void testGetNotificationsWithCursor() throws Exception {
        log.info("========== [TEST REPORT] 1. 커서 기반 목록 조회 ==========");

        log.info("▶ [STEP 1] 첫 번째 페이지(최신) 10개 요청 (cursor=null)");
        MvcResult firstPageResult = mockMvc.perform(get("/api/v1/notifications")
                        .param("limit", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasNext").value(true))
                .andExpect(jsonPath("$.items.length()").value(10))
                .andReturn();

        JsonNode firstPageNode = objectMapper.readTree(
                firstPageResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String nextCursor = firstPageNode.path("nextCursor").asText();

        log.info("  ↳ {}개 조회 성공 | hasNext: {} | nextCursor: {}",
                firstPageNode.path("items").size(),
                firstPageNode.path("hasNext").asBoolean(),
                nextCursor);

        log.info("▶ [STEP 2] 두 번째 페이지 5개 요청 (cursor={})", nextCursor);
        MvcResult secondPageResult = mockMvc.perform(get("/api/v1/notifications")
                        .param("cursor", nextCursor)
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.items.length()").value(5))
                .andReturn();

        JsonNode secondPageNode = objectMapper.readTree(
                secondPageResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        log.info("  ↳ {}개 조회 성공 | hasNext: {} | 마지막 페이지 도달 확인",
                secondPageNode.path("items").size(),
                secondPageNode.path("hasNext").asBoolean());

        targetNotifId = firstPageNode.path("items").get(0).path("id").asLong();
        log.info("▶ [STEP 3] 후속 테스트용 타겟 알림 ID 획득: {}", targetNotifId);
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 2: 안읽은 알림 배지 카운트
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(2)
    @DisplayName("2. [GET] 헤더 배지용 안 읽은 알림 개수 조회")
    void testGetUnreadCount() throws Exception {
        log.info("========== [TEST REPORT] 2. 안읽은 알림 개수 조회 ==========");

        MvcResult result = mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(content().string("15"))
                .andReturn();

        log.info("  ↳ 안읽은 알림 수 [ {} ] (기대값: 15)", result.getResponse().getContentAsString());
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 3: 단건 읽음 처리 + 카운트 감소 확인
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(3)
    @DisplayName("3. [PATCH] 단건 알림 읽음 처리 및 카운트 검증")
    void testMarkAsRead() throws Exception {
        log.info("========== [TEST REPORT] 3. 단건 알림 읽음 처리 ==========");
        log.info("▶ [STEP 1] 알림 ID [{}] 읽음 처리 요청", targetNotifId);

        mockMvc.perform(patch("/api/v1/notifications/" + targetNotifId + "/read"))
                .andExpect(status().isOk());
        log.info("  ↳ 읽음 처리 API 호출 성공 (HTTP 200)");

        MvcResult listResult = mockMvc.perform(get("/api/v1/notifications")
                        .param("limit", "10"))
                .andReturn();

        JsonNode items = objectMapper.readTree(
                listResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("items");
        boolean isRead = false;
        for (JsonNode item : items) {
            if (item.path("id").asLong() == targetNotifId) {
                isRead = item.path("isRead").asBoolean();
                break;
            }
        }
        Assertions.assertTrue(isRead, "읽음 처리된 알림의 isRead가 true여야 합니다.");
        log.info("▶ [STEP 2] isRead 상태 검증 [ {} ]", isRead);

        MvcResult countResult = mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(content().string("14"))
                .andReturn();
        log.info("▶ [STEP 3] 카운트 검증: 남은 안읽은 알림 수 [ {} ] (기대값: 14)",
                countResult.getResponse().getContentAsString());
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 4: 보안 엣지케이스 - 해커 접근 차단
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(4)
    @DisplayName("4. [PATCH] 보안 - 해커(999)가 타인 알림 읽음 시도")
    void testUnauthorizedRead() throws Exception {
        log.info("========== [TEST REPORT] 4. 타인 알림 접근 차단 검증 ==========");

        notificationService.sendNotification(MY_USER_ID, "test", "해커 타겟 알림", "내용", "/secure");

        // MY_USER_ID로 최신 알림 ID 조회
        MvcResult result = mockMvc.perform(get("/api/v1/notifications")
                        .param("limit", "1"))
                .andReturn();

        long freshNotifId = objectMapper.readTree(
                        result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("items").get(0).path("id").asLong();

        log.info("▶ [STEP 1] 해커(ID:{})가 유저(ID:{}) 알림(ID:{}) 읽음 시도", HACKER_ID, MY_USER_ID, freshNotifId);

        // ✅ 해커로 컨텍스트 교체 후 접근 시도
        setAuth(HACKER_ID);
        MvcResult failResult = mockMvc.perform(patch("/api/v1/notifications/" + freshNotifId + "/read"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOTI-002"))
                .andReturn();

        JsonNode errorNode = objectMapper.readTree(
                failResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        log.info("  ↳ 방어 성공! 403 Forbidden | 에러코드: {}", errorNode.path("code").asText());

        // ✅ 피해 유저 카운트 확인을 위해 다시 MY_USER_ID로 복구
        setAuth(MY_USER_ID);
        MvcResult countResult = mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(content().string("15"))
                .andReturn();
        log.info("▶ [STEP 2] 피해 유저 안읽은 상태 보존 확인 (개수: {})",
                countResult.getResponse().getContentAsString());
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 5: 전체 읽음 처리
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(5)
    @DisplayName("5. [PATCH] 전체 읽음 처리 검증")
    void testReadAll() throws Exception {
        log.info("========== [TEST REPORT] 5. 전체 알림 읽음 처리 ==========");

        MvcResult patchResult = mockMvc.perform(patch("/api/v1/notifications/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(16))
                .andReturn();

        log.info("▶ [STEP 1] 전체 읽음 | 업데이트 개수: {}",
                objectMapper.readTree(patchResult.getResponse().getContentAsString(StandardCharsets.UTF_8))
                        .path("updatedCount").asInt());

        MvcResult countResult = mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(content().string("0"))
                .andReturn();
        log.info("▶ [STEP 2] 카운트 검증 [ {} ] (기대값: 0)", countResult.getResponse().getContentAsString());

        MvcResult listResult = mockMvc.perform(get("/api/v1/notifications")
                        .param("limit", "10"))
                .andExpect(jsonPath("$.items[0].isRead").value(true))
                .andReturn();

        log.info("▶ [STEP 3] 첫 번째 알림 isRead [ {} ]",
                objectMapper.readTree(listResult.getResponse().getContentAsString(StandardCharsets.UTF_8))
                        .path("items").get(0).path("isRead").asBoolean());
        log.info("========================================================\n");
    }
}
