package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.request.WithdrawRequestCreateRequest;
import com.ssafy.be.domain.wallet.entity.WithdrawRequest;
import com.ssafy.be.domain.wallet.repository.WithdrawRequestRepository;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.ConcurrentTestUtil;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
@DisplayName("Wallet Withdraw Request 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
public class WalletWithdrawLockTest {

    public static final int NUMBER_OF_THREADS = 500;
    private static final long INITIAL_BALANCE = 100000;
    private static final long WITHDRAW_AMOUNT = 10000L;
    private static final long MAX_VALID_WITHDRAW_COUNT = INITIAL_BALANCE / WITHDRAW_AMOUNT; // 최대 출금 가능 요청 횟수

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private WalletWithdrawService walletWithdrawService;
    @Autowired
    private OptimisticLockWithdrawRequestFacade optimisticLockWithdrawRequestFacade;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WithdrawRequestRepository withdrawRequestRepository;

    private User user;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║         Wallet withdraw Lock 통합 테스트 Suite 시작            ║");
        IT_LOG.info("║              Layer  : Service →  DB Lock                   ║");
        IT_LOG.info("║             시나리오: 동시성 처리가 강력한 락 검증                  ║");
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
        // given (각 케이스 공통): 가용 잔액만 보유한 유저
        user = userRepository.save(
                TestFixture.createUser("출금 요청 유저").toBuilder()
                        .balance(INITIAL_BALANCE)
                        .depositedBidBalance(0L)
                        .depositedEscrowBalance(0L)
                        .depositedWithdrawBalance(0L)
                        .build());
    }

    @AfterEach
    void tearDown() {
        withdrawRequestRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 동시성 제어 락 검증")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class WithdrawLockTest {

        /*
         * I-1 (주석 처리): User @Version 있으면 커밋 단계에서 막혀 과다 출금 행/원장 불일치가 비결정적으로 재현됨.
         *
        @Test
        @Order(1)
        @DisplayName("I-1. 락 미적용 시, 동일 유저에게 동시 출금 요청이 몰리면 잔액 대비 출금 건수 정합성이 깨질 수 있다.")
        void multipleSucceed_noLock() throws InterruptedException {
            WithdrawRequestCreateRequest request = new WithdrawRequestCreateRequest(WITHDRAW_AMOUNT);

            IT_LOG.info("    [요청] 동일 유저 1명에 대해 {}회 동시 출금 요청 (락 미적용 requestWithdrawWithoutLock)", NUMBER_OF_THREADS);

            long startTime = System.currentTimeMillis();

            int successCount = ConcurrentTestUtil.executeConcurrentWithdrawRequests(
                    NUMBER_OF_THREADS,
                    () -> walletWithdrawService.requestWithdrawWithoutLock(request, user.getId()));

            long executionTime = System.currentTimeMillis() - startTime;

            long withdrawRowCount = withdrawRequestRepository.countByUserId(user.getId());
            User reloaded = userRepository.findById(user.getId()).orElseThrow();
            long sumRequestedAmount = withdrawRequestRepository.findAllByUserId(user.getId()).stream()
                    .mapToLong(WithdrawRequest::getAmount)
                    .sum();

            IT_LOG.info("    [검증] 실행 시간: {}ms, 예외 없이 완료된 요청 수: {}, DB 출금 요청 행 수: {}, 요청금액 합: {}, 잔액: {}, 예치출금: {}", executionTime, successCount, withdrawRowCount, sumRequestedAmount, reloaded.getBalance(), reloaded.getDepositedWithdrawBalance());

            assertThat(MAX_VALID_WITHDRAW_COUNT).isEqualTo(10);

            boolean overSubscribed = withdrawRowCount > MAX_VALID_WITHDRAW_COUNT;
            boolean ledgerMismatch = sumRequestedAmount != reloaded.getDepositedWithdrawBalance();

            assertThat(overSubscribed || ledgerMismatch).isTrue();
            IT_LOG.info("    [검증] ✔ 과다 출금 행={}, 원장 불일치={}", overSubscribed, ledgerMismatch);
        }
        */

        @Test
        @Order(2)
        @DisplayName("I-2. 비관적 락 적용 시, 동시 출금 요청이 몰려도 잔액 한도 내에서만 성공하고 출금 행·예치 금액이 일치해야 한다.")
        void consistencyMaintained_withPessimisticLock() throws InterruptedException {
            // given
            WithdrawRequestCreateRequest request = new WithdrawRequestCreateRequest(WITHDRAW_AMOUNT);
            IT_LOG.info("    [요청] 동일 유저 1명에 대해 {}회 동시 출금 요청 (비관적 락 requestWithdrawPessimistic)", NUMBER_OF_THREADS);

            // when
            long startTime = System.currentTimeMillis();
            int successCount = ConcurrentTestUtil.executeConcurrentWithdrawRequests(
                    NUMBER_OF_THREADS,
                    () -> walletWithdrawService.requestWithdrawPessimistic(request, user.getId()));
            long executionTime = System.currentTimeMillis() - startTime;

            // then
            long withdrawRowCount = withdrawRequestRepository.countByUserId(user.getId());
            User reloaded = userRepository.findById(user.getId()).orElseThrow();
            long sumRequestedAmount = withdrawRequestRepository.findAllByUserId(user.getId()).stream()
                    .mapToLong(WithdrawRequest::getAmount)
                    .sum();

            IT_LOG.info("    [검증] 실행 시간: {}ms, 예외 없이 완료된 요청 수: {}, DB 출금 요청 행 수: {}, 요청금액 합: {}, 잔액: {}, 예치출금: {}", executionTime, successCount, withdrawRowCount, sumRequestedAmount, reloaded.getBalance(), reloaded.getDepositedWithdrawBalance());

            assertThat(withdrawRowCount).isEqualTo(MAX_VALID_WITHDRAW_COUNT); // 실제 출금 요청 행 수가 최대 출금 가능 요청 횟수와 일치
            assertThat(sumRequestedAmount).isEqualTo(reloaded.getDepositedWithdrawBalance()); // 출금 요청 금액 합과 예치 출금 잔액이 일치
            assertThat(successCount).isEqualTo(MAX_VALID_WITHDRAW_COUNT); // 예외 없이 끝난 호출 수 = 허용 최대(나머지는 잔액 부족 예외)
            assertThat(reloaded.getBalance()).isZero(); // 전액 출금 예치로 이동했으므로 가용 잔액 0
            assertThat(reloaded.getDepositedWithdrawBalance()).isEqualTo(INITIAL_BALANCE); // 예치 출금 합이 초기 잔액과 동일(10회×출금액)

            IT_LOG.info("    [검증] ✔ 비관적 락으로 출금 건수·원장 정합성 유지");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. 낙관적 락 적용 시, 동시 출금 요청이 몰려도 잔액 한도 내에서만 성공하고 출금 행·예치 금액이 일치해야 한다.")
        void consistencyMaintained_withOptimisticLock() throws InterruptedException {
            // given
            WithdrawRequestCreateRequest request = new WithdrawRequestCreateRequest(WITHDRAW_AMOUNT);
            IT_LOG.info("    [요청] 동일 유저 1명에 대해 {}회 동시 출금 요청 (낙관적 락 + Facade 재시도 processWithdrawRequest)", NUMBER_OF_THREADS);

            // when
            long startTime = System.currentTimeMillis();
            int successCount = ConcurrentTestUtil.executeConcurrentWithdrawRequests(
                    NUMBER_OF_THREADS,
                    () -> optimisticLockWithdrawRequestFacade.processWithdrawRequest(request, user.getId()));
            long executionTime = System.currentTimeMillis() - startTime;

            // then
            long withdrawRowCount = withdrawRequestRepository.countByUserId(user.getId());
            User reloaded = userRepository.findById(user.getId()).orElseThrow();
            long sumRequestedAmount = withdrawRequestRepository.findAllByUserId(user.getId()).stream()
                    .mapToLong(WithdrawRequest::getAmount)
                    .sum();

            IT_LOG.info("    [검증] 실행 시간: {}ms, 예외 없이 완료된 요청 수: {}, DB 출금 요청 행 수: {}, 요청금액 합: {}, 잔액: {}, 예치출금: {}", executionTime, successCount, withdrawRowCount, sumRequestedAmount, reloaded.getBalance(), reloaded.getDepositedWithdrawBalance());

            assertThat(withdrawRowCount).isEqualTo(MAX_VALID_WITHDRAW_COUNT); // DB에 남은 출금 요청 행 수가 잔액 한도상 허용 최대(10건)와 일치
            assertThat(sumRequestedAmount).isEqualTo(reloaded.getDepositedWithdrawBalance()); // 출금 요청 금액 합과 user 예치 출금 잔액이 동일(원장 일치)
            assertThat(successCount).isEqualTo(MAX_VALID_WITHDRAW_COUNT); // 버전 충돌 시 예외로 실패 처리 → 성공 건수는 허용 최대와 동일
            assertThat(reloaded.getBalance()).isZero(); // 전액 출금 예치로 이동
            assertThat(reloaded.getDepositedWithdrawBalance()).isEqualTo(INITIAL_BALANCE); // 예치 출금 합이 초기 잔액과 동일

            IT_LOG.info("    [검증] ✔ 낙관적 락(@Version)으로 출금 건수·원장 정합성 유지");
        }
    }
}
