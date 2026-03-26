package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.user.entity.BankCode;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.response.WalletSummaryResponse;
import com.ssafy.be.domain.wallet.dto.response.WithdrawRequestResponse;
import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import com.ssafy.be.domain.wallet.repository.WithdrawRequestRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static com.ssafy.be.domain.wallet.entity.WithdrawStatus.PENDING;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@IntegrationTest
@DisplayName("WalletQuery 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class WalletQueryServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private WalletQueryService walletQueryService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WithdrawRequestRepository withdrawRequestRepository;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║              WalletQuery 통합 테스트 Suite 시작               ║");
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        IT_LOG.info("║     Suite 종료  |  총 소요: {}ms{}", total,
                " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
    }

    @AfterEach
    void cleanup() {
        withdrawRequestRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 지갑 요약")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class WalletSummaryTest {

        @Test
        @Order(1)
        @DisplayName("WQ-1. 잔액·예치 합계를 반환한다.")
        void getWalletSummary_success() {
            // given
            User user = userRepository.save(TestFixture.createUser("지갑유저").toBuilder()
                    .balance(100_000L)
                    .depositedBidBalance(1_000L)
                    .depositedEscrowBalance(2_000L)
                    .depositedWithdrawBalance(5_000L)
                    .build());

            // when
            WalletSummaryResponse res = walletQueryService.getWalletSummary(user.getId());

            // then
            assertThat(res.balance()).isEqualTo(100_000L);
            assertThat(res.depositedBalance()).isEqualTo(8_000L);
            IT_LOG.info("    [검증] ✔ 요약 응답");
        }

        @Test
        @Order(2)
        @DisplayName("WQ-2. 없는 유저면 USER_NOT_FOUND")
        void getWalletSummary_userMissing_throws() {
            // given: 존재하지 않는 userId

            // when & then
            assertThatThrownBy(() -> walletQueryService.getWalletSummary(9_999_999L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e -> assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND));
            IT_LOG.info("    [검증] ✔ USER_NOT_FOUND");
        }
    }

    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 출금 요청 목록")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class WithdrawListTest {

        @Test
        @Order(1)
        @DisplayName("WQ-3. status=null이면 전체 출금 요청을 반환한다.")
        void getAllWithdrawRequests_all() {
            // given
            User u1 = userRepository.save(TestFixture.createUser("u1").toBuilder()
                    .bankCode(BankCode.KB.getCode())
                    .accountName("홍길동")
                    .accountNum("110-123")
                    .build());
            User u2 = userRepository.save(TestFixture.createUser("u2").toBuilder()
                    .bankCode(BankCode.SHINHAN.getCode())
                    .accountName("김철수")
                    .accountNum("220-456")
                    .build());
            withdrawRequestRepository.save(TestFixture.createWithdrawRequest(10_000L, PENDING, u1));
            withdrawRequestRepository.save(
                    TestFixture.createWithdrawRequest(20_000L, WithdrawStatus.COMPLETED, u2));

            // when
            List<WithdrawRequestResponse> list = walletQueryService.getAllWithdrawRequests(null);

            // then
            assertThat(list).hasSize(2);
            IT_LOG.info("    [검증] ✔ 전체 목록");
        }

        @Test
        @Order(2)
        @DisplayName("WQ-4. PENDING만 필터한다.")
        void getAllWithdrawRequests_pendingOnly() {
            // given
            User u = userRepository.save(TestFixture.createUser("필터유저").toBuilder()
                    .bankCode(BankCode.KB.getCode())
                    .accountName("이영희")
                    .accountNum("330-789")
                    .build());
            withdrawRequestRepository.save(TestFixture.createWithdrawRequest(10_000L, PENDING, u));
            withdrawRequestRepository.save(
                    TestFixture.createWithdrawRequest(30_000L, WithdrawStatus.COMPLETED, u));

            // when
            List<WithdrawRequestResponse> list = walletQueryService.getAllWithdrawRequests(PENDING);

            // then
            assertThat(list).hasSize(1);
            assertThat(list.get(0).amount()).isEqualTo(10_000L);
            assertThat(list.get(0).status()).isEqualTo(PENDING);
            assertThat(list.get(0).bankCode()).isEqualTo(BankCode.KB.getCode());
            IT_LOG.info("    [검증] ✔ PENDING 필터");
        }
    }
}
