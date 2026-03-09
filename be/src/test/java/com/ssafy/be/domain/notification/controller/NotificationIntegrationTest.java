package com.ssafy.be.domain.notification.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.notification.model.NotificationRedisKeys;
import com.ssafy.be.domain.notification.service.NotificationService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=" +
                "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
                "com.google.cloud.spring.autoconfigure.secretmanager.GcpSecretManagerAutoConfiguration," +
                "com.google.cloud.spring.autoconfigure.storage.GcpStorageAutoConfiguration," +
                "com.google.cloud.spring.autoconfigure.core.GcpContextAutoConfiguration"
})
@AutoConfigureMockMvc(addFilters = false)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class NotificationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private NotificationService notificationService;
    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private ObjectMapper objectMapper;

    private static final Long MY_USER_ID = 1L;
    private static final Long HACKER_ID  = 999L;

    private Long targetNotifId;   // Order 3, 4에서 사용할 아직 안읽은 알림 ID
    private Long hackerTargetId;  // Order 4 전용: 해커가 접근 시도할 MY_USER_ID 소유 알림

    @BeforeAll
    void setUp() {
        // Redis 완전 초기화 (격리)
        redisTemplate.delete(NotificationRedisKeys.getUserInboxKey(MY_USER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserUnreadKey(MY_USER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserInboxKey(HACKER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserUnreadKey(HACKER_ID));

        // 테스트용 알림 15개 발송
        for (int i = 1; i <= 15; i++) {
            notificationService.sendNotification(
                    MY_USER_ID, "test", "알림 " + i, "내용 " + i, "/url/" + i
            );
        }
    }

    // ────────────────────────────────────────────────────────────
    // Order 1: 알림 목록 페이징 조회
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(1)
    @DisplayName("1. [GET] 알림 목록 1페이지 (10개) 조회 - 페이징 및 hasNext 확인")
    void testGetNotifications() throws Exception {
        mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Id", MY_USER_ID)
                        .param("page", "0")
                        .param("limit", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasNext").value(true))
                .andExpect(jsonPath("$.items.length()").value(10))
                .andExpect(jsonPath("$.unreadCount").value(15))
                // 응답 필드 구조 검증
                .andExpect(jsonPath("$.items[0].id").exists())
                .andExpect(jsonPath("$.items[0].title").exists())
                .andExpect(jsonPath("$.items[0].body").exists())
                .andExpect(jsonPath("$.items[0].isRead").value(false))
                .andExpect(jsonPath("$.items[0].actionUrl").exists());

        // 2페이지(나머지 5개) 검증
        mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Id", MY_USER_ID)
                        .param("page", "1")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.items.length()").value(5));

        // 다음 테스트용 ID 추출 (Jackson 사용, split 대신)
        MvcResult result = mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Id", MY_USER_ID)
                        .param("page", "0")
                        .param("limit", "1"))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        targetNotifId  = root.path("items").get(0).path("id").asLong();
        hackerTargetId = targetNotifId; // 해커가 노릴 알림 = MY_USER_ID 소유
    }

    // ────────────────────────────────────────────────────────────
    // Order 2: 안읽은 알림 배지 카운트
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(2)
    @DisplayName("2. [GET] 헤더 배지용 안 읽은 알림 개수 조회")
    void testGetUnreadCount() throws Exception {
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("X-User-Id", MY_USER_ID))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string("15"));
    }

    // ────────────────────────────────────────────────────────────
    // Order 3: 단건 읽음 처리 + 카운트 감소 확인
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(3)
    @DisplayName("3. [PATCH] 단건 알림 읽음 처리 - 200 반환 및 unreadCount 15 → 14 감소")
    void testMarkAsRead() throws Exception {
        mockMvc.perform(patch("/api/v1/notifications/" + targetNotifId + "/read")
                        .header("X-User-Id", MY_USER_ID))
                .andDo(print())
                .andExpect(status().isOk());

        // 읽음 처리 후 해당 알림의 isRead 상태 변경 확인
        MvcResult result = mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Id", MY_USER_ID)
                        .param("page", "0")
                        .param("limit", "10"))
                .andReturn();

        JsonNode items = objectMapper.readTree(
                result.getResponse().getContentAsString()
        ).path("items");

        // 읽음 처리된 알림이 목록에서 isRead=true 인지 확인
        boolean readFlagUpdated = false;
        for (JsonNode item : items) {
            if (item.path("id").asLong() == targetNotifId) {
                readFlagUpdated = item.path("isRead").asBoolean();
                break;
            }
        }
        Assertions.assertTrue(readFlagUpdated, "읽음 처리된 알림의 isRead가 true여야 합니다.");

        // unreadCount 14로 감소 확인
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("X-User-Id", MY_USER_ID))
                .andExpect(status().isOk())
                .andExpect(content().string("14"));
    }

    // ────────────────────────────────────────────────────────────
    // Order 4: 보안 엣지케이스 - 해커가 타인 알림 읽음 시도 → 403
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(4)
    @DisplayName("4. [PATCH] 보안 엣지케이스 - 해커(999)가 타인 알림 읽음 시도 → 403 + NOTI-002")
    void testUnauthorizedRead() throws Exception {
        // 해커가 접근할 알림: MY_USER_ID 소유의 아직 안읽은 알림 새로 발송
        notificationService.sendNotification(
                MY_USER_ID, "test", "해커 타겟 알림", "내용", "/secure"
        );

        MvcResult result = mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Id", MY_USER_ID)
                        .param("page", "0")
                        .param("limit", "1"))
                .andReturn();

        long freshNotifId = objectMapper
                .readTree(result.getResponse().getContentAsString())
                .path("items").get(0).path("id").asLong();

        // 해커 ID로 타인 알림 읽음 처리 시도
        mockMvc.perform(patch("/api/v1/notifications/" + freshNotifId + "/read")
                        .header("X-User-Id", HACKER_ID))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOTI-002"))
                .andExpect(jsonPath("$.message").exists());

        // MY_USER_ID의 알림은 여전히 안읽음 상태 유지 확인
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("X-User-Id", MY_USER_ID))
                .andExpect(content().string("15")); // 14 + 새 알림 1개
    }

    // ────────────────────────────────────────────────────────────
    // Order 5: 전체 읽음 처리
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(5)
    @DisplayName("5. [PATCH] 전체 읽음 처리 - 남은 15개 모두 읽음 + 카운트 0")
    void testReadAll() throws Exception {
        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .header("X-User-Id", MY_USER_ID))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(15));

        // unreadCount 0 확인
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("X-User-Id", MY_USER_ID))
                .andExpect(status().isOk())
                .andExpect(content().string("0"));

        // 목록에서 모든 알림이 isRead=true인지 샘플 확인
        mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Id", MY_USER_ID)
                        .param("page", "0")
                        .param("limit", "10"))
                .andExpect(jsonPath("$.items[0].isRead").value(true))
                .andExpect(jsonPath("$.items[9].isRead").value(true));
    }
}
