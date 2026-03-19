package com.ssafy.be.domain.follow.service;

import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.follow.exception.FollowErrorCode;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.TestReportExtension;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith({MockitoExtension.class, TestReportExtension.class})
@DisplayName("FollowService 단위 테스트")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FollowServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks private FollowService followService;
    @Mock private FollowRepository followRepository;
    @Mock private UserRepository userRepository;
    @Mock private SellerRepository sellerRepository;

    private User me;
    private User sellerUser;
    private Seller targetSeller;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       FollowService 단위 테스트 Suite 시작               ║");
        TEST_LOG.info("║  Layer   : Service (Mockito)                             ║");
        TEST_LOG.info("║  시나리오: S-1~2, I-1~2  (2 Group / 4 Cases)            ║");
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║     Suite 종료  |  총 소요: {}ms{}",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @BeforeEach
    void setUp() {
        me = User.createUser("buyer@test.com", "pw", "구매자", "010-1111-1111");
        ReflectionTestUtils.setField(me, "id", 1L);

        sellerUser = User.createUser("seller@test.com", "pw", "판매자", "010-2222-2222");
        ReflectionTestUtils.setField(sellerUser, "id", 2L);

        targetSeller = Seller.builder()
                .intro("판매자 소개")
                 .type(SellerType.INDIVIDUAL)
                .penaltyCount(0)
                .user(sellerUser)
                .build();
        ReflectionTestUtils.setField(targetSeller, "id", 10L);
    }

    // ═══ Group 1 : Smoke (기본 로직 검증) ═══════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Group 1 │ Smoke 로직 검증")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class Smoke {
        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 🔥 Group 1 │ Smoke 로직 검증");
            TEST_LOG.info("│  검증 목표: 정상 팔로우 토글 시 DB 메서드 호출 및 결과 매핑 확인");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-1. 신규 팔로우 시도 → 저장 로직 수행 후 following: true 반환")
        void toggleFollow_Create() {
            TEST_LOG.info("    [요청] toggleFollow(1L, 10L) -> 신규 팔로우");

            given(userRepository.findById(1L)).willReturn(Optional.of(me));
            given(sellerRepository.findById(10L)).willReturn(Optional.of(targetSeller));
            // 처음 팔로우하는 상태 세팅
            given(followRepository.findByUserAndSeller(me, targetSeller)).willReturn(Optional.empty());
            given(followRepository.countBySeller(targetSeller)).willReturn(1L);
            given(followRepository.countByUser(me)).willReturn(1L);

            FollowResponse response = followService.toggleFollow(1L, 10L);

            assertThat(response.following()).isTrue();
            verify(followRepository).save(any(Follow.class));

            TEST_LOG.info("    [검증] ✔ followRepository.save() 1회 호출 확인");
            TEST_LOG.info("    [검증] ✔ following == true 반환 확인");
        }

        @Test
        @Order(2)
        @DisplayName("S-2. 기존 팔로우 토글 시도 → 삭제 로직 수행 후 following: false 반환")
        void toggleFollow_Delete() {
            TEST_LOG.info("    [요청] toggleFollow(1L, 10L) -> 언팔로우");

            Follow existingFollow = Follow.builder().user(me).seller(targetSeller).build();
            given(userRepository.findById(1L)).willReturn(Optional.of(me));
            given(sellerRepository.findById(10L)).willReturn(Optional.of(targetSeller));
            // 이미 팔로우중인 상태 셋팅
            given(followRepository.findByUserAndSeller(me, targetSeller)).willReturn(Optional.of(existingFollow));
            given(followRepository.countBySeller(targetSeller)).willReturn(0L);
            given(followRepository.countByUser(me)).willReturn(0L);

            FollowResponse response = followService.toggleFollow(1L, 10L);

            assertThat(response.following()).isFalse();
            verify(followRepository).delete(existingFollow);

            TEST_LOG.info("    [검증] ✔ followRepository.delete() 1회 호출 확인");
            TEST_LOG.info("    [검증] ✔ following == false 반환 확인");
        }
    }

    // ═══ Group 2 : Step-up (예외/엣지 케이스) ══════════════════════
    @Nested
    @Order(2)
    @DisplayName("Group 2 │ 예외 발생 검증")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StepUp {
        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ 예외 발생 검증");
            TEST_LOG.info("│  검증 목표: 에러 상황에서 예상된 GlobalException 정상 발생");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-1. 자기 자신을 팔로우 → SELF_FOLLOW_NOT_ALLOWED 예외 발생")
        void selfFollow_ThrowsException() {
            TEST_LOG.info("    [요청] me(1L) 가 본인 seller 계정 팔로우 시도");

            Seller mySellerProfile = Seller.builder()
                    .intro("나도 판매자")
                    .penaltyCount(0)
                    .user(me)
                    .build();
            ReflectionTestUtils.setField(mySellerProfile, "id", 11L);

            given(userRepository.findById(1L)).willReturn(Optional.of(me));
            given(sellerRepository.findById(11L)).willReturn(Optional.of(mySellerProfile));

            assertThatThrownBy(() -> followService.toggleFollow(1L, 11L))
                    .isInstanceOf(GlobalException.class)
                    .hasMessageContaining(FollowErrorCode.SELF_FOLLOW_NOT_ALLOWED.getMessage());

            TEST_LOG.info("    [검증] ✔ SELF_FOLLOW_NOT_ALLOWED 예외 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 존재하지 않는 User/Seller → NOT_FOUND 예외 발생")
        void notFound_ThrowsException() {
            TEST_LOG.info("    [요청] 존재하지 않는 유저(99L)가 팔로우 시도");
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> followService.toggleFollow(99L, 10L))
                    .isInstanceOf(GlobalException.class)
                    .hasMessageContaining(FollowErrorCode.USER_NOT_FOUND.getMessage());

            TEST_LOG.info("    [검증] ✔ USER_NOT_FOUND 예외 확인");
        }
    }
}
