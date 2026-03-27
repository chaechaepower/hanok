package com.ssafy.be.domain.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.notification.model.NotificationRedisKeys;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@IntegrationTest
@AutoConfigureMockMvc(addFilters = false)
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
@DisplayName("Notification 통합 테스트")
class NotificationIntegrationTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();
    private static final Long USER_ID   = 1L;
    private static final Long HACKER_ID = 999L;

    @Autowired MockMvc mockMvc;
    @Autowired NotificationService notificationService;
    @Autowired StringRedisTemplate redisTemplate;
    @Autowired ObjectMapper objectMapper;

    // ═══════════════════════════════════════════════════════════
    // Suite 시작/종료
    // ═══════════════════════════════════════════════════════════
    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║           Notification 통합 테스트 Suite 시작              ║");
        IT_LOG.info("║  Layer  : Controller → Service → Redis (Testcontainers)   ║");
        IT_LOG.info("║  Auth   : MockMvc + SecurityContextHolder (Filter OFF)     ║");
        IT_LOG.info("║  시나리오: I-1 ~ I-8  (4 Group / 8 Cases)                 ║");
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║  Suite 종료  |  총 소요: {}ms", total);
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    // ═══════════════════════════════════════════════════════════
    // 공통 Setup / Teardown
    // ═══════════════════════════════════════════════════════════
    @BeforeEach
    void setUp() {
        redisTemplate.delete(NotificationRedisKeys.getUserInboxKey(USER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserUnreadKey(USER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserInboxKey(HACKER_ID));
        redisTemplate.delete(NotificationRedisKeys.getUserUnreadKey(HACKER_ID));
        setAuth(USER_ID);
        IT_LOG.info("    [setUp] Redis 키 초기화 완료 | 인증 userId={}", USER_ID);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        IT_LOG.info("    [tearDown] SecurityContext 초기화 완료");
    }

    // ═══════════════════════════════════════════════════════════
    // 헬퍼
    // ═══════════════════════════════════════════════════════════
    private void setAuth(Long userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        String.valueOf(userId), null, List.of()));
    }

    private void seed(int count) {
        for (int i = 1; i <= count; i++) {
            notificationService.sendNotification(
                    USER_ID, "test", "알림 " + i, "내용 " + i, Map.of("ref", i));
        }
        IT_LOG.info("    [seed] 알림 {}건 생성 완료 (userId={})", count, USER_ID);
    }

    private long latestNotifId() throws Exception {
        MvcResult r = mockMvc.perform(
                get("/api/v1/notifications").param("limit", "1")).andReturn();
        long id = objectMapper.readTree(
                        r.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("items").get(0).path("id").asLong();
        IT_LOG.info("    [helper] latestNotifId = {}", id);
        return id;
    }

    // ═══════════════════════════════════════════════════════════
    // Group 1 : 커서 기반 페이징
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Group 1 │ 커서 기반 페이징")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class CursorPaging {

        @BeforeAll
        static void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌────────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Group 1 │ 커서 기반 페이징");
            IT_LOG.info("│  검증 목표: 15개 알림을 10 + 5로 분할 페이징 / 빈 inbox 처리");
            IT_LOG.info("└────────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-1+2. 커서 기반 페이징: 15개 → 10 + 5 분할")
        void cursorPaging() throws Exception {
            // given
            IT_LOG.info("    [요청] 알림 15건 생성");
            seed(15);

            // when - 1페이지
            IT_LOG.info("    [진행] GET /api/v1/notifications?limit=10  (1페이지)");
            MvcResult r1 = mockMvc.perform(
                            get("/api/v1/notifications").param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.hasNext").value(true))
                    .andExpect(jsonPath("$.items.length()").value(10))
                    .andReturn();

            String cursor = objectMapper.readTree(
                            r1.getResponse().getContentAsString(StandardCharsets.UTF_8))
                    .path("nextCursor").asText();

            IT_LOG.info("    [결과] ✔ 1페이지: items=10, hasNext=true");
            IT_LOG.info("    [결과] ✔ nextCursor = {}", cursor);

            // when - 2페이지
            IT_LOG.info("    [진행] GET /api/v1/notifications?cursor={}&limit=10  (2페이지)", cursor);
            mockMvc.perform(get("/api/v1/notifications")
                            .param("cursor", cursor).param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.hasNext").value(false))
                    .andExpect(jsonPath("$.items.length()").value(5));

            IT_LOG.info("    [결과] ✔ 2페이지: items=5, hasNext=false");
            IT_LOG.info("    [해소] cursor 기반 페이징으로 전체 15건 정확히 분할 조회 보장");
        }

        @Test
        @Order(2)
        @DisplayName("I-3. 알림 없을 때 빈 목록 반환")
        void emptyInbox() throws Exception {
            // given
            IT_LOG.info("    [요청] 알림 0건 상태에서 목록 조회");

            // when & then
            IT_LOG.info("    [진행] GET /api/v1/notifications?limit=10");
            mockMvc.perform(get("/api/v1/notifications").param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items.length()").value(0))
                    .andExpect(jsonPath("$.hasNext").value(false));

            IT_LOG.info("    [결과] ✔ items=[], hasNext=false 확인");
            IT_LOG.info("    [해소] 빈 inbox에서 예외 없이 정상 응답 보장");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Group 2 : 읽지 않은 배지 카운트
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Group 2 │ 읽지 않은 배지 카운트")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UnreadCount {

        @BeforeAll
        static void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌────────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Group 2 │ 읽지 않은 배지 카운트");
            IT_LOG.info("│  검증 목표: Redis unread 카운터 정확성 보장");
            IT_LOG.info("└────────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-4. 안읽은 배지 카운트 15 반환")
        void unreadCount() throws Exception {
            // given
            IT_LOG.info("    [요청] 알림 15건 생성 → 전부 미읽음 상태");
            seed(15);

            // when & then
            IT_LOG.info("    [진행] GET /api/v1/notifications/unread-count");
            mockMvc.perform(get("/api/v1/notifications/unread-count"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("15"));

            IT_LOG.info("    [결과] ✔ unreadCount = 15 확인");
            IT_LOG.info("    [해소] Redis unread 카운터가 발송 건수와 정확히 일치함 보장");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Group 3 : 단건 읽음 처리 + 보안
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(3)
    @DisplayName("Group 3 │ 단건 읽음 처리 + 보안")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class MarkAsRead {

        @BeforeAll
        static void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌────────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Group 3 │ 단건 읽음 처리 + 보안");
            IT_LOG.info("│  검증 목표: 읽음 처리 후 카운트 감소 / 타인 접근 차단(NOTI-002)");
            IT_LOG.info("└────────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-5. 단건 읽음 처리: isRead=true, count-1")
        void markAsRead() throws Exception {
            // given
            IT_LOG.info("    [요청] 알림 3건 생성 후 최신 알림 단건 읽음 처리");
            seed(3);
            long id = latestNotifId();

            // when
            IT_LOG.info("    [진행] PATCH /api/v1/notifications/{}/read", id);
            mockMvc.perform(patch("/api/v1/notifications/" + id + "/read"))
                    .andExpect(status().isOk());
            IT_LOG.info("    [결과] ✔ 200 OK 확인");

            // then
            IT_LOG.info("    [진행] GET /api/v1/notifications/unread-count (읽음 처리 후 확인)");
            mockMvc.perform(get("/api/v1/notifications/unread-count"))
                    .andExpect(content().string("2"));

            IT_LOG.info("    [결과] ✔ unreadCount = 2 (3 → 2 감소) 확인");
            IT_LOG.info("    [해소] 단건 읽음 처리 시 Redis 카운터 -1 정확히 반영 보장");
        }

        @Test
        @Order(2)
        @DisplayName("I-6. 보안: 해커가 타인 알림 읽음 시도 → 403 NOTI-002")
        void markAsRead_unauthorized() throws Exception {
            // given
            IT_LOG.info("    [요청] userId={} 알림 1건 생성", USER_ID);
            seed(1);
            long id = latestNotifId();

            IT_LOG.info("    [준비] 인증 전환: userId={} (해커)", HACKER_ID);
            setAuth(HACKER_ID);

            // when & then
            IT_LOG.info("    [진행] PATCH /api/v1/notifications/{}/read  (해커 요청)", id);
            IT_LOG.info("    [기대] 403 Forbidden | ErrorCode=NOTI-002");
            mockMvc.perform(patch("/api/v1/notifications/" + id + "/read"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("NOTI-002"));

            IT_LOG.info("    [결과] ✔ 403 Forbidden 확인");
            IT_LOG.info("    [결과] ✔ ErrorCode = NOTI-002 확인");
            IT_LOG.info("    [해소] 타인 알림 접근 시 권한 오류로 명확히 차단됨 보장");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Group 4 : 전체 읽음 처리
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(4)
    @DisplayName("Group 4 │ 전체 읽음 처리")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ReadAll {

        @BeforeAll
        static void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌────────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Group 4 │ 전체 읽음 처리");
            IT_LOG.info("│  검증 목표: 일괄 처리 건수 반환 / 중복 호출 멱등성 보장");
            IT_LOG.info("└────────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-7. 전체 읽음 처리: updatedCount=5, count=0")
        void readAll() throws Exception {
            // given
            IT_LOG.info("    [요청] 알림 5건 생성 후 전체 읽음 처리");
            seed(5);

            // when
            IT_LOG.info("    [진행] PATCH /api/v1/notifications/read-all");
            mockMvc.perform(patch("/api/v1/notifications/read-all"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updatedCount").value(5));

            IT_LOG.info("    [결과] ✔ updatedCount = 5 확인");

            // then
            IT_LOG.info("    [진행] GET /api/v1/notifications/unread-count (전체 읽음 후 확인)");
            mockMvc.perform(get("/api/v1/notifications/unread-count"))
                    .andExpect(content().string("0"));

            IT_LOG.info("    [결과] ✔ unreadCount = 0 확인");
            IT_LOG.info("    [해소] 전체 읽음 처리 후 Redis 카운터 완전 초기화 보장");
        }

        @Test
        @Order(2)
        @DisplayName("I-8. 이미 전체 읽음 상태에서 readAll → updatedCount=0 (멱등성)")
        void readAll_whenAlreadyAllRead() throws Exception {
            // given
            IT_LOG.info("    [요청] 알림 3건 생성 → 1차 전체 읽음 처리");
            seed(3);
            mockMvc.perform(patch("/api/v1/notifications/read-all")).andReturn();
            IT_LOG.info("    [준비] 1차 readAll 완료 → 이미 전체 읽음 상태");

            // when & then
            IT_LOG.info("    [진행] PATCH /api/v1/notifications/read-all  (2차 호출)");
            IT_LOG.info("    [기대] updatedCount = 0 (처리 대상 없음)");
            mockMvc.perform(patch("/api/v1/notifications/read-all"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updatedCount").value(0));

            IT_LOG.info("    [결과] ✔ updatedCount = 0 확인");
            IT_LOG.info("    [해소] 중복 readAll 호출 시 멱등성 보장 (불필요한 Redis write 없음)");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Group 5 : 알림 설정 (Settings)
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(5)
    @DisplayName("Group 5 │ 알림 설정 (Settings)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class NotificationSettings {

        @BeforeAll
        static void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌────────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Group 5 │ 알림 설정 (Settings)");
            IT_LOG.info("│  검증 목표: 유저의 알림 수신 여부 조회 및 변경 연동 확인");
            IT_LOG.info("└────────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-9. 알림 설정 조회: 기본값(true) 반환 확인")
        void getNotificationSetting() throws Exception {
            IT_LOG.info("    [진행] GET /api/v1/users/me/notification");
            mockMvc.perform(get("/api/v1/users/me/notification"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.notificationSetting").value(true));
            
            IT_LOG.info("    [결과] ✔ notificationSetting=true (기본값) 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-10. 알림 설정 수정: true → false 변경 및 조회 확인")
        void updateNotificationSetting() throws Exception {
            // 1. 설정 변경 (true -> false)
            IT_LOG.info("    [진행] PATCH /api/v1/users/me/notification (Setting=false)");
            String requestBody = "{\"notificationSetting\": false}";

            mockMvc.perform(patch("/api/v1/users/me/notification")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.notificationSetting").value(false));

            IT_LOG.info("    [결과] ✔ PATCH 결과 notificationSetting=false 확인");

            // 2. 재조회하여 검증
            IT_LOG.info("    [진행] GET /api/v1/users/me/notification (변경 후 재조회)");
            mockMvc.perform(get("/api/v1/users/me/notification"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.notificationSetting").value(false));

            IT_LOG.info("    [결과] ✔ 재조회 결과 notificationSetting=false 확인");
            IT_LOG.info("    [해소] 유저별 알림 수신 설정이 DB에 정상 반영 및 조회됨 보장");
        }
    }
}
