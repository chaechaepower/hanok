package com.ssafy.be.domain.follow;

import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@IntegrationTest
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Follow 통합 테스트 (Smoke + Step-up)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
@Transactional
class FollowIntegrationTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private FollowRepository followRepository;

    private User buyer;
    private User sellerUser;
    private Seller seller;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║           Follow 통합 테스트 Suite 시작                    ║");
        IT_LOG.info("║  Layer  : Controller → Service → Repository (Test DB)      ║");
        IT_LOG.info("║  시나리오: S-1~2, I-1~2  (2 Group / 4 Cases)               ║");
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
        // Mock 데이터 통계
        buyer = userRepository.save(User.createUser("buyer@test.com", "pw", "구매자", "010-1111-1111"));
        sellerUser = userRepository.save(User.createUser("seller@test.com", "pw", "판매자", "010-2222-2222"));
        seller = sellerRepository.save(Seller.builder()
                .intro("안녕하세요 판매자입니다.")
                .type(SellerType.INDIVIDUAL)
                .penaltyCount(0)
                .user(sellerUser)
                .build());

        // Spring Context Authorization Injection (addFilters=false 대응)
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                buyer.getId().toString(), null, Collections.emptyList());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ═══ Group 1 : Smoke (실제 동작 보장) ════════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Group 1 │ Smoke — 기본 응답 및 DB 반영")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class Smoke {

        @BeforeAll
        static void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 🔥 Smoke │ Follow 파이프라인 정상 동작 확인");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-1. 유효 대상 팔로우 시 DB 적재 반영")
        void toggleFollow_Insert() throws Exception {
            IT_LOG.info("    [요청] buyer({})가 seller({}) 팔로우 시도", buyer.getId(), seller.getId());

            mockMvc.perform(post("/api/v1/follow/{targetSellerId}", seller.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.following").value(true));

            assertThat(followRepository.existsByUserAndSeller(buyer, seller)).isTrue();
            IT_LOG.info("    [검증] ✔ 200 OK 응답 수신");
            IT_LOG.info("    [검증] ✔ DB Follow 테이블 데이터 영속화 확인");
        }

        @Test
        @Order(2)
        @DisplayName("S-2. 기팔로우 대상 토글 시 언팔로우 DB 반영")
        void toggleFollow_Delete() throws Exception {
            followRepository.save(Follow.builder().user(buyer).seller(seller).build());
            IT_LOG.info("    [준비] 이미 팔로우 중인 상태 세팅 완료");
            IT_LOG.info("    [요청] 기팔로우 셀러 재토글 요청");

            mockMvc.perform(post("/api/v1/follow/{targetSellerId}", seller.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.following").value(false));

            assertThat(followRepository.existsByUserAndSeller(buyer, seller)).isFalse();
            IT_LOG.info("    [검증] ✔ 200 OK 응답 수신");
            IT_LOG.info("    [검증] ✔ DB Follow 테이블에서 데이터 성공적 파기 확인");
        }
    }

    // ═══ Group 2 : Step-up (엣지 및 예외) ═══════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Group 2 │ Step-up — 예외 처리 통합 검증")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StepUp {

        @BeforeAll
        static void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Step-up │ Follow 글로벌 예외 핸들링 검증");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-1. 자기 본인을 팔로우 시 400 Bad Request")
        void selfFollow_BadRequest() throws Exception {
            // buyer 자신도 판매자로 동시 가입되어 있다고 가정
            Seller buyerSeller = sellerRepository.save(Seller.builder()
                    .intro("나도 판매자").type(SellerType.INDIVIDUAL).penaltyCount(0).user(buyer).build());

            IT_LOG.info("    [요청] 본인 셀러 계정({}) 팔로우 시도", buyerSeller.getId());

            mockMvc.perform(post("/api/v1/follow/{targetSellerId}", buyerSeller.getId()))
                    .andExpect(status().isBadRequest())
                    // ExceptionHandler 가 내려주는 code 필드 확인
                    .andExpect(jsonPath("$.code").value("FOLLOW-003")); // FollowErrorCode.SELF_FOLLOW_NOT_ALLOWED 코드 확인 (명칭에 맞게 변경)

            IT_LOG.info("    [검증] ✔ 본인 팔로우 제한 로직을 통한 400 응답 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 존재하지 않는 Seller ID 팔로우 대상 지정 시 404")
        void notFoundSeller() throws Exception {
            IT_LOG.info("    [요청] DB에 없는 9999L 셀러 팔로우 시도");

            mockMvc.perform(post("/api/v1/follow/{targetSellerId}", 9999L))
                    .andExpect(status().isNotFound());

            IT_LOG.info("    [검증] ✔ 404 Not Found 확인 및 정상 예외 매핑 확인");
        }
    }
}
