package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.client.BiznoClient;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.*;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.response.SellerRankingResponse;
import com.ssafy.be.domain.stream.repository.StreamRepository;
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
    @Mock private ItemRepository itemRepository;
    @Mock private StreamRepository streamRepository;
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
            Seller seller = Seller.builder().user(user).build();
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
            Seller seller = Seller.builder().user(user).build();
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
}
