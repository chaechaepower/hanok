package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.client.BiznoClient;
import com.ssafy.be.domain.seller.dto.request.SellerProfileUpdateRequest;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.*;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.response.SellerRankingResponse;
import com.ssafy.be.support.util.TestFixture;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
@DisplayName("SellerService 도메인 로직 테스트 (Report Style)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class SellerServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks private SellerService sellerService;

    @Mock private SellerRepository sellerRepository;
    @Mock private UserRepository userRepository;
    @Mock private FollowRepository followRepository;
    @Mock private EscrowRepository escrowRepository;
    @Mock private BiznoClient biznoClient;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       SellerService 비즈니스 로직 테스트 Suite 시작        ║");
        TEST_LOG.info("║  Layer : Service (Unit Test with Mockito)                ║");
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

    @Nested @Order(1)
    @DisplayName("Section 1 │ 판매자 등록 (Register)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SellerRegisterTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 1 │ Seller Registration");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("SR-1. 이미 등록된 판매자 예외 발생")
        void register_AlreadyExists_ThrowsGlobalException() {
            given(sellerRepository.existsByUserId(1L)).willReturn(true);
            SellerRegisterRequest request = new SellerRegisterRequest(SellerType.INDIVIDUAL, null, "경매왕", "안녕", "", "", "", null, null, null);

            assertThatThrownBy(() -> sellerService.register(1L, request))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e -> {
                        GlobalException ge = (GlobalException) e;
                        assertThat(ge.getErrorCode()).isEqualTo(SellerErrorCode.SELLER_ALREADY_EXISTS);
                    });
            TEST_LOG.info("    [검증] ✔ SELLER_ALREADY_EXISTS 예외 발생 확인");
        }

        @Test @Order(2)
        @DisplayName("SR-2. 존재하지 않는 유저 예외 발생")
        void register_UserNotFound_ThrowsGlobalException() {
            given(sellerRepository.existsByUserId(1L)).willReturn(false);
            given(userRepository.findById(1L)).willReturn(Optional.empty());
            SellerRegisterRequest request = new SellerRegisterRequest(SellerType.INDIVIDUAL, null, "경매왕", "안녕", "", "", "", null, null, null);

            assertThatThrownBy(() -> sellerService.register(1L, request))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e -> {
                        GlobalException ge = (GlobalException) e;
                        assertThat(ge.getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND);
                    });
            TEST_LOG.info("    [검증] ✔ USER_NOT_FOUND 예외 발생 확인");
        }

        @Test @Order(3)
        @DisplayName("SR-3. 정상 판매자 등록 성공")
        void register_ValidRequest_Success() {
            User user = User.createUser("t@t.com", "p", "경매왕", "010");
            Seller seller = TestFixture.createSeller(user);
            given(sellerRepository.existsByUserId(1L)).willReturn(false);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(sellerRepository.save(any(Seller.class))).willReturn(seller);

            SellerRegisterResponse response = sellerService.register(1L, new SellerRegisterRequest(SellerType.INDIVIDUAL, null, "경매왕", "안녕", "", "", "", null, null, null));

            assertThat(response.nickname()).isEqualTo("경매왕");
            TEST_LOG.info("    [검증] ✔ 판매자 데이터 저장 및 닉네임 반환 확인");
        }
    }

    @Nested @Order(2)
    @DisplayName("Section 2 │ 판매자 랭킹 및 조회 (Ranking)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SellerRankingTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 2 │ Seller Ranking");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("RN-1. 팔로워 수 기준 상위 셀러 조회")
        void getTopSellers_success() {
            User user = User.createUser("t@t.com", "p", "스니커즈마켓", "010");
            Seller seller = TestFixture.createSeller(user);
            ReflectionTestUtils.setField(seller, "id", 1L);
            List<Object[]> mockRows = new ArrayList<>();
            mockRows.add(new Object[]{1L, 1024L});

            given(followRepository.findTopSellerIdsByFollowerCount(any())).willReturn(mockRows);
            given(sellerRepository.findAllByIdInWithUser(List.of(1L))).willReturn(List.of(seller));

            List<SellerRankingResponse> result = sellerService.getTopSellers();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).nickname()).isEqualTo("스니커즈마켓");
            assertThat(result.get(0).followerCount()).isEqualTo(1024L);
            TEST_LOG.info("    [검증] ✔ 1위 셀러 닉네임 및 팔로워 수(1024) 확인");
        }

        @Test @Order(2)
        @DisplayName("RN-2. 데이터 없을 시 빈 리스트 반환")
        void getTopSellers_empty() {
            given(followRepository.findTopSellerIdsByFollowerCount(any())).willReturn(List.of());

            List<SellerRankingResponse> result = sellerService.getTopSellers();

            assertThat(result).isEmpty();
            then(sellerRepository).should(never()).findAllByIdInWithUser(any());
            TEST_LOG.info("    [검증] ✔ 빈 결과 시 리포지토리 조회 건너뜀 확인");
        }
    }

    @Nested
    @Order(3)
    @DisplayName("Section 3 │ 판매자 등록 여부 (getSellerStatus)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SellerStatusTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 3 │ getSellerStatus");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("ST-1. 등록된 판매자면 isSeller=true 및 sellerId")
        void getSellerStatus_whenRegistered() {
            Seller seller = TestFixture.createSeller(User.createUser("a@a.com", "p", "n", "010"));
            ReflectionTestUtils.setField(seller, "id", 42L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));

            SellerStatusResponse response = sellerService.getSellerStatus(1L);

            assertThat(response.isSeller()).isTrue();
            assertThat(response.sellerId()).isEqualTo(42L);
            TEST_LOG.info("    [검증] ✔ isSeller·sellerId");
        }

        @Test
        @Order(2)
        @DisplayName("ST-2. 미등록이면 isSeller=false")
        void getSellerStatus_whenNotRegistered() {
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.empty());

            SellerStatusResponse response = sellerService.getSellerStatus(1L);

            assertThat(response.isSeller()).isFalse();
            assertThat(response.sellerId()).isNull();
            TEST_LOG.info("    [검증] ✔ 미등록 응답");
        }
    }

    @Nested
    @Order(4)
    @DisplayName("Section 4 │ 프로필 수정 (updateProfile)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UpdateProfileTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 4 │ updateProfile");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        private Seller sellerOwnedBy(long userId) {
            User user = User.createUser("o@o.com", "p", "닉", "010").toBuilder().id(userId).build();
            Seller seller = TestFixture.createSeller(user).toBuilder()
                    .type(SellerType.BUSINESS)
                    .intro("구소개")
                    .build();
            ReflectionTestUtils.setField(seller, "id", 100L);
            return seller;
        }

        @Test
        @Order(1)
        @DisplayName("UP-1. 판매자 없으면 SELLER_NOT_FOUND")
        void updateProfile_whenSellerMissing_throws() {
            given(sellerRepository.findById(100L)).willReturn(Optional.empty());
            SellerProfileUpdateRequest request = new SellerProfileUpdateRequest("n", null, "i", null, null, null);

            assertThatThrownBy(() -> sellerService.updateProfile(100L, 1L, request))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode()).isEqualTo(SellerErrorCode.SELLER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ SELLER_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("UP-2. 본인이 아니면 SELLER_FORBIDDEN")
        void updateProfile_whenNotOwner_throws() {
            Seller seller = sellerOwnedBy(10L);
            given(sellerRepository.findById(100L)).willReturn(Optional.of(seller));
            SellerProfileUpdateRequest request = new SellerProfileUpdateRequest("해킹", null, null, null, null, null);

            assertThatThrownBy(() -> sellerService.updateProfile(100L, 99L, request))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode()).isEqualTo(SellerErrorCode.SELLER_FORBIDDEN));
            TEST_LOG.info("    [검증] ✔ SELLER_FORBIDDEN");
        }

        @Test
        @Order(3)
        @DisplayName("UP-3. 본인이면 소개·SNS·유저 닉네임 반영")
        void updateProfile_whenOwner_updates() {
            Seller seller = sellerOwnedBy(10L);
            given(sellerRepository.findById(100L)).willReturn(Optional.of(seller));
            SellerProfileUpdateRequest request = new SellerProfileUpdateRequest(
                    "새닉", "https://img/p.png", "새소개", "https://in.st/a", "https://yt/b", "https://tt/c");

            sellerService.updateProfile(100L, 10L, request);

            assertThat(seller.getIntro()).isEqualTo("새소개");
            assertThat(seller.getInstaUrl()).isEqualTo("https://in.st/a");
            assertThat(seller.getYoutubeUrl()).isEqualTo("https://yt/b");
            assertThat(seller.getTiktokUrl()).isEqualTo("https://tt/c");
            assertThat(seller.getUser().getNickname()).isEqualTo("새닉");
            assertThat(seller.getUser().getProfileImage()).isEqualTo("https://img/p.png");
            TEST_LOG.info("    [검증] ✔ 엔티티 필드 갱신");
        }
    }

    @Nested
    @Order(5)
    @DisplayName("Section 5 │ 사업자번호 검증 (verifyBizno)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class BiznoVerifyTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 5 │ verifyBizno");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("BZ-1. API 응답 null이면 valid=false")
        void verifyBizno_whenNullResponse() {
            given(biznoClient.verify("123", 1)).willReturn(null);

            assertThat(sellerService.verifyBizno("123", 1).valid()).isFalse();
            TEST_LOG.info("    [검증] ✔ null → false");
        }

        @Test
        @Order(2)
        @DisplayName("BZ-2. resultCode≠0 또는 totalCount=0이면 valid=false")
        void verifyBizno_whenApiErrorOrEmpty() {
            given(biznoClient.verify("123", 1)).willReturn(new BiznoApiResponse(1, 0, List.of()));

            assertThat(sellerService.verifyBizno("123", 1).valid()).isFalse();
            TEST_LOG.info("    [검증] ✔ 오류 코드·빈 건수");
        }

        @Test
        @Order(3)
        @DisplayName("BZ-3. bstt에 '계속사업자' 없으면 valid=false")
        void verifyBizno_whenNotContinuingBusiness() {
            given(biznoClient.verify("123", 1)).willReturn(new BiznoApiResponse(0, 1,
                    List.of(new BiznoApiResponse.BiznoItem("폐업"))));

            assertThat(sellerService.verifyBizno("123", 1).valid()).isFalse();
            TEST_LOG.info("    [검증] ✔ 비계속");
        }

        @Test
        @Order(4)
        @DisplayName("BZ-4. bstt에 '계속사업자' 포함 시 valid=true")
        void verifyBizno_whenContinuingBusiness() {
            given(biznoClient.verify("123", 1)).willReturn(new BiznoApiResponse(0, 1,
                    List.of(new BiznoApiResponse.BiznoItem("계속사업자 단일"))));

            assertThat(sellerService.verifyBizno("123", 1).valid()).isTrue();
            TEST_LOG.info("    [검증] ✔ 계속사업자");
        }
    }

    @Nested
    @Order(6)
    @DisplayName("Section 6 │ 평판 조회 (getReputation)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ReputationTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 6 │ getReputation");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        private Seller sellerForReputation(long sellerId, long ownerUserId) {
            User user = User.createUser("r@r.com", "p", "판매자", "010").toBuilder().id(ownerUserId).build();
            Seller seller = TestFixture.createSeller(user).toBuilder()
                    .avgShipDays(3.5)
                    .build();
            ReflectionTestUtils.setField(seller, "id", sellerId);
            return seller;
        }

        @Test
        @Order(1)
        @DisplayName("RP-1. 판매자 없으면 SELLER_NOT_FOUND")
        void getReputation_whenSellerMissing_throws() {
            given(sellerRepository.findById(1L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> sellerService.getReputation(1L, null))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode()).isEqualTo(SellerErrorCode.SELLER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ SELLER_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("RP-2. 비소유자는 followerCount만")
        void getReputation_whenNotOwner_public() {
            Seller seller = sellerForReputation(1L, 10L);
            given(sellerRepository.findById(1L)).willReturn(Optional.of(seller));
            given(followRepository.countBySellerId(1L)).willReturn(50L);

            SellerReputationResponse response = sellerService.getReputation(1L, 999L);

            assertThat(response.followerCount()).isEqualTo(50L);
            assertThat(response.totalTrades()).isNull();
            assertThat(response.completionRate()).isNull();
            TEST_LOG.info("    [검증] ✔ 공개 응답");
        }

        @Test
        @Order(3)
        @DisplayName("RP-3. 소유자는 거래·성사율·배송일 포함")
        void getReputation_whenOwner_detail() {
            Seller seller = sellerForReputation(1L, 10L);
            given(sellerRepository.findById(1L)).willReturn(Optional.of(seller));
            given(followRepository.countBySellerId(1L)).willReturn(7L);
            given(escrowRepository.countBySellerIdAndEscrowStatus(1L, EscrowStatus.COMPLETED)).willReturn(8L);
            given(escrowRepository.countBySellerIdAndEscrowStatus(1L, EscrowStatus.CANCELLED)).willReturn(2L);

            SellerReputationResponse response = sellerService.getReputation(1L, 10L);

            assertThat(response.followerCount()).isEqualTo(7L);
            assertThat(response.totalTrades()).isEqualTo(10L);
            assertThat(response.completionRate()).isEqualTo(80.0);
            assertThat(response.cancelCount()).isEqualTo(2L);
            assertThat(response.avgShipDays()).isEqualTo(3.5);
            TEST_LOG.info("    [검증] ✔ 상세 평판");
        }
    }

    @Nested
    @Order(7)
    @DisplayName("Section 7 │ 낙찰 에스크로 목록 (getAllSoldAuctions)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SoldAuctionsTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 7 │ getAllSoldAuctions");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("SA-1. 에스크로 없으면 빈 리스트")
        void getAllSoldAuctions_whenEmpty() {
            given(escrowRepository.findBySellerId(1L)).willReturn(List.of());

            assertThat(sellerService.getAllSoldAuctions(1L)).isEmpty();
            TEST_LOG.info("    [검증] ✔ 빈 목록");
        }
    }
}
