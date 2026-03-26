package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.request.WithdrawRequestCreateRequest;
import com.ssafy.be.domain.wallet.entity.WithdrawRequest;
import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import com.ssafy.be.domain.wallet.exception.WalletErrorCode;
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

import static com.ssafy.be.domain.wallet.entity.WithdrawStatus.COMPLETED;
import static com.ssafy.be.domain.wallet.entity.WithdrawStatus.PENDING;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@IntegrationTest
@DisplayName("WalletWithdraw 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class WalletWithdrawServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private WalletWithdrawService walletWithdrawService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WithdrawRequestRepository withdrawRequestRepository;
    @Autowired
    private TradeReportRepository tradeReportRepository;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║             WalletWithdraw 통합 테스트 Suite 시작             ║");
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
        tradeReportRepository.deleteAllInBatch();
        withdrawRequestRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 출금 요청 (락 전략)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class RequestWithdrawTest {

        @Test
        @Order(1)
        @DisplayName("WW-1. 출금 요청 시 잔액에서 출금 예치로 이동한다.")
        void requestWithdrawOptimistic_success() {
            // given
            User user = userRepository.save(TestFixture.createUser("출금3").toBuilder()
                    .balance(80_000L)
                    .depositedWithdrawBalance(0L)
                    .build());

            // when
            walletWithdrawService.requestWithdrawOptimistic(new WithdrawRequestCreateRequest(10_000L), user.getId());

            // then
            User reloaded = userRepository.findById(user.getId()).orElseThrow();
            assertThat(reloaded.getBalance()).isEqualTo(70_000L);
            assertThat(reloaded.getDepositedWithdrawBalance()).isEqualTo(10_000L);
            IT_LOG.info("    [검증] ✔ OptimisticLock 성공");
        }

        @Test
        @Order(2)
        @DisplayName("WW-2. 최소 금액 미만이면 WALLET_WITHDRAW_AMOUNT_TOO_LOW")
        void requestWithdraw_amountTooLow() {
            // given
            User user = userRepository.save(TestFixture.createUser("소액").toBuilder().balance(100_000L).build());

            // when & then
            assertThatThrownBy(() ->
                    walletWithdrawService.requestWithdrawWithoutLock(new WithdrawRequestCreateRequest(9_999L), user.getId()))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(WalletErrorCode.WALLET_WITHDRAW_AMOUNT_TOO_LOW));
            IT_LOG.info("    [검증] ✔ 최소 금액");
        }

        @Test
        @Order(3)
        @DisplayName("WW-3. 잔액 부족이면 WALLET_INSUFFICIENT_BALANCE")
        void requestWithdraw_insufficientBalance() {
            // given
            User user = userRepository.save(TestFixture.createUser("빈곤").toBuilder().balance(5_000L).build());

            // when & then
            assertThatThrownBy(() ->
                    walletWithdrawService.requestWithdrawWithoutLock(new WithdrawRequestCreateRequest(10_000L), user.getId()))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(WalletErrorCode.WALLET_INSUFFICIENT_BALANCE));
            IT_LOG.info("    [검증] ✔ 잔액 부족");
        }

        @Test
        @Order(4)
        @DisplayName("WW-4. 없는 유저면 USER_NOT_FOUND")
        void requestWithdraw_userMissing() {
            // given: 존재하지 않는 userId (사전 데이터 없음)

            // when & then
            assertThatThrownBy(() ->
                    walletWithdrawService.requestWithdrawWithoutLock(new WithdrawRequestCreateRequest(10_000L), 8_888_888L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND));
            IT_LOG.info("    [검증] ✔ USER_NOT_FOUND");
        }
    }

    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 출금 완료 처리")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class CompleteWithdrawTest {

        @Test
        @Order(1)
        @DisplayName("WW-5. completeWithdraw — COMPLETED·예치 차감·WITHDRAW 거래내역")
        void completeWithdraw_success() {
            // given
            User user = userRepository.save(TestFixture.createUser("완료유저").toBuilder()
                    .balance(90_000L)
                    .depositedWithdrawBalance(10_000L)
                    .build());
            WithdrawRequest wr = withdrawRequestRepository.save(
                    TestFixture.createWithdrawRequest(10_000L, PENDING, user));

            // when
            walletWithdrawService.completeWithdraw(wr.getId());

            // then
            WithdrawRequest reloaded = withdrawRequestRepository.findById(wr.getId()).orElseThrow();
            assertThat(reloaded.getWithdrawStatus()).isEqualTo(COMPLETED);
            assertThat(reloaded.getProcessedAt()).isNotNull();
            User userAfter = userRepository.findById(user.getId()).orElseThrow();
            assertThat(userAfter.getDepositedWithdrawBalance()).isZero();
            assertThat(tradeReportRepository.findAll()).hasSize(1);
            TradeReport tr = tradeReportRepository.findAll().get(0);
            assertThat(tr.getTradeType()).isEqualTo(TradeType.WITHDRAW);
            assertThat(tr.getAmount()).isEqualTo(10_000L);
            IT_LOG.info("    [검증] ✔ 출금 완료 파이프라인");
        }

        @Test
        @Order(2)
        @DisplayName("WW-6. 없는 출금 요청이면 WALLET_WITHDRAW_REQUEST_NOT_FOUND")
        void completeWithdraw_notFound() {
            // given: 존재하지 않는 withdraw id

            // when & then
            assertThatThrownBy(() -> walletWithdrawService.completeWithdraw(7_777_777L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode())
                                    .isEqualTo(WalletErrorCode.WALLET_WITHDRAW_REQUEST_NOT_FOUND));
            IT_LOG.info("    [검증] ✔ NOT_FOUND");
        }

        @Test
        @Order(3)
        @DisplayName("WW-7. 이미 처리된 요청이면 WALLET_WITHDRAW_ALREADY_PROCESSED")
        void completeWithdraw_alreadyProcessed() {
            // given
            User user = userRepository.save(TestFixture.createUser("중복").toBuilder()
                    .balance(80_000L)
                    .depositedWithdrawBalance(10_000L)
                    .build());
            WithdrawRequest wr = withdrawRequestRepository.save(
                    TestFixture.createWithdrawRequest(10_000L, PENDING, user));
            // when (1차 완료)
            walletWithdrawService.completeWithdraw(wr.getId());

            // when & then (2차 시도)
            assertThatThrownBy(() -> walletWithdrawService.completeWithdraw(wr.getId()))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode())
                                    .isEqualTo(WalletErrorCode.WALLET_WITHDRAW_ALREADY_PROCESSED));
            IT_LOG.info("    [검증] ✔ 이미 처리됨");
        }
    }
}
