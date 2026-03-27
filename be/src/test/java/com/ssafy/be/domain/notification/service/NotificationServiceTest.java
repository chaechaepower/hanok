package com.ssafy.be.domain.notification.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.notification.exception.NotificationErrorCode;
import com.ssafy.be.domain.notification.model.Notification;
import com.ssafy.be.domain.notification.repository.NotificationRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.TestReportExtension;
import com.ssafy.be.global.sse.enums.SseEventType;
import com.ssafy.be.global.sse.service.SseEmitterService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
@DisplayName("NotificationService 단위 테스트")
class NotificationServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Mock NotificationRepository notificationRepository;
    @Mock SseEmitterService sseEmitterService;
    @Mock UserRepository userRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUpNotificationService() {
        JsonConverter jsonConverter = new JsonConverter(new ObjectMapper());
        notificationService = new NotificationService(
                notificationRepository,
                sseEmitterService,
                userRepository,
                jsonConverter
        );
    }

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║         NotificationService 단위 테스트 Suite 시작       ║");
        TEST_LOG.info("║  Layer   : Service (Pure Unit)                           ║");
        TEST_LOG.info("║  Mock    : NotificationRepository, SseEmitterService     ║");
        TEST_LOG.info("║  시나리오: U-1 ~ U-5  (3 Group / 5 Cases)               ║");
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║         Suite 종료  |  총 소요: {}ms{}║",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
        TEST_LOG.info("");
    }

    // ═══════════════════════════════════════════════════════════
    // Group 1 : 알림 발송
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Group 1 │ 알림 발송 (sendNotification)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SendNotification {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 1 │ 알림 발송 (sendNotification)");
            TEST_LOG.info("│  검증 목표: Redis 저장 1회 + SSE 전송 1회 동시 보장");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("U-1. Redis 저장 + SSE 전송 각 1회")
        void sendNotification_success() {
            // given
            TEST_LOG.info("    [요청] userId=1 | type=PURCHASE | title=구매 완료");
            TEST_LOG.info("    [요청] message=상품이 결제되었습니다. | routingField=orderId");

            User user = mock(User.class);
            when(user.getNotificationSetting()).thenReturn(true);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            // when
            TEST_LOG.info("    [진행] sendNotification() 호출");
            notificationService.sendNotification(
                    1L, "PURCHASE", "구매 완료", "상품이 결제되었습니다.", Map.of("orderId", 1L)
            );

            // then
            verify(notificationRepository, times(1)).save(any(Notification.class));
            TEST_LOG.info("    [검증] ✔ notificationRepository.save()  → 1회 호출");

            verify(sseEmitterService, times(1))
                    .sendToClient(eq(SseEventType.NOTIFICATION), eq(1L), any());
            TEST_LOG.info("    [검증] ✔ sseEmitterService.sendToClient(NOTIFICATION, userId=1) → 1회 호출");
            TEST_LOG.info("    [해소] 알림 저장 + 실시간 SSE 전송 원자적 동작 보장");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Group 2 : 단건 읽음 처리
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Group 2 │ 단건 읽음 처리 (readNotification)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ReadNotification {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ 단건 읽음 처리 (readNotification)");
            TEST_LOG.info("│  검증 목표: 없는 알림(NOTI-001) / 타인 알림(NOTI-002) 예외 처리");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("U-2. 알림 없음 → NOTI-001 예외")
        void readNotification_notFound() {
            // given
            TEST_LOG.info("    [요청] userId=1 | notificationId=999 (존재하지 않는 알림)");
            TEST_LOG.info("    [준비] findById(999) → null Mock 설정");
            given(notificationRepository.findById(999L)).willReturn(null);

            // when & then
            TEST_LOG.info("    [진행] readNotification(userId=1, notificationId=999) 호출");
            TEST_LOG.info("    [기대] GlobalException | ErrorCode=NOTIFICATION_NOT_FOUND(NOTI-001)");
            assertThatThrownBy(() -> notificationService.readNotification(1L, 999L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e -> {
                        assertThat(((GlobalException) e).getErrorCode())
                                .isEqualTo(NotificationErrorCode.NOTIFICATION_NOT_FOUND);
                        TEST_LOG.info("    [검증] ✔ ErrorCode = {} 확인",
                                ((GlobalException) e).getErrorCode());
                    });
            TEST_LOG.info("    [해소] 없는 알림 접근 시 NOTI-001 예외로 명확히 거부됨 보장");
        }

        @Test
        @Order(2)
        @DisplayName("U-3. 타인 알림 접근 → NOTI-002 예외")
        void readNotification_unauthorized() {
            // given
            TEST_LOG.info("    [요청] 접근자 userId=1 | 알림 소유자 userId=2 (권한 없음)");
            Notification noti = Notification.builder()
                    .id(1L)
                    .userId(2L)
                    .type("TEST")
                    .title("t")
                    .body("b")
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .routingField(null)
                    .build();
            TEST_LOG.info("    [준비] findById(1) → Notification(owner=2L) Mock 설정");
            given(notificationRepository.findById(1L)).willReturn(noti);

            // when & then
            TEST_LOG.info("    [진행] readNotification(접근자=1L, notificationId=1L) 호출");
            TEST_LOG.info("    [기대] GlobalException | ErrorCode=UNAUTHORIZED_READ(NOTI-002)");
            assertThatThrownBy(() -> notificationService.readNotification(1L, 1L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e -> {
                        assertThat(((GlobalException) e).getErrorCode())
                                .isEqualTo(NotificationErrorCode.UNAUTHORIZED_READ);
                        TEST_LOG.info("    [검증] ✔ ErrorCode = {} 확인",
                                ((GlobalException) e).getErrorCode());
                    });
            TEST_LOG.info("    [해소] 타인 알림 접근 시 NOTI-002 예외로 명확히 거부됨 보장");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Group 3 : 전체 읽음 처리
    // ═══════════════════════════════════════════════════════════
    @Nested
    @Order(3)
    @DisplayName("Group 3 │ 전체 읽음 처리 (readAllNotifications)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ReadAllNotifications {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 3 │ 전체 읽음 처리 (readAllNotifications)");
            TEST_LOG.info("│  검증 목표: early return(0개) / 일괄 처리(N개) 분기 보장");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("U-4. 안읽은 0개 → markAllAsRead 미호출, 0 반환")
        void readAll_whenEmpty() {
            // given
            TEST_LOG.info("    [요청] userId=1 전체 읽음 처리");
            TEST_LOG.info("    [준비] getUnreadCount(1) → 0 Mock 설정");
            given(notificationRepository.getUnreadCount(1L)).willReturn(0);

            // when
            TEST_LOG.info("    [진행] readAllNotifications(1L) 호출");
            int result = notificationService.readAllNotifications(1L);

            // then
            assertThat(result).isEqualTo(0);
            TEST_LOG.info("    [검증] ✔ 반환값 = {} (기대: 0)", result);

            verify(notificationRepository, never()).markAllAsRead(any());
            TEST_LOG.info("    [검증] ✔ markAllAsRead() 미호출 확인 (불필요한 Redis write 없음)");
            TEST_LOG.info("    [해소] 안읽은 알림 0개 시 early return 동작 보장");
        }

        @Test
        @Order(2)
        @DisplayName("U-5. 안읽은 있음 → markAllAsRead 1회, 개수 반환")
        void readAll_whenExists() {
            // given
            TEST_LOG.info("    [요청] userId=1 전체 읽음 처리");
            TEST_LOG.info("    [준비] getUnreadCount(1) → 5 Mock 설정");
            given(notificationRepository.getUnreadCount(1L)).willReturn(5);

            // when
            TEST_LOG.info("    [진행] readAllNotifications(1L) 호출");
            int result = notificationService.readAllNotifications(1L);

            // then
            assertThat(result).isEqualTo(5);
            TEST_LOG.info("    [검증] ✔ 반환값 = {} (기대: 5)", result);

            verify(notificationRepository, times(1)).markAllAsRead(1L);
            TEST_LOG.info("    [검증] ✔ markAllAsRead(userId=1) 정확히 1회 호출 확인");
            TEST_LOG.info("    [해소] 안읽은 알림 5건 일괄 처리 및 처리 건수 반환 보장");
        }
    }
}
