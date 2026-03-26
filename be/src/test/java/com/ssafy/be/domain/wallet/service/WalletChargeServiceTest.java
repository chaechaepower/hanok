package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCompleteRequest;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCreateRequest;
import com.ssafy.be.domain.wallet.dto.response.WalletChargeCreateResponse;
import com.ssafy.be.domain.wallet.exception.WalletErrorCode;
import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.model.WalletCharge;
import com.ssafy.be.domain.wallet.repository.WalletChargeRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import io.portone.sdk.server.payment.PaidPayment;
import io.portone.sdk.server.payment.PayPendingPayment;
import io.portone.sdk.server.payment.PaymentAmount;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.ssafy.be.domain.tradereport.entity.TradeType.CHARGE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@IntegrationTest
@DisplayName("WalletCharge 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class WalletChargeServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();
    private static final long CHARGE_AMOUNT = 10000L;

    @Autowired
    private WalletChargeService walletChargeService;
    @Autowired
    private WalletChargeRepository walletChargeRepository;
    @Autowired
    private TradeReportRepository tradeReportRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private StringRedisTemplate redisTemplate;

    @MockitoBean
    private PortoneClient portoneClient;

    private User user;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║            WalletCharge 통합 테스트 Suite 시작              ║");
        IT_LOG.info("║              Layer  : Service → Redis / DB               ║");
        IT_LOG.info("║         시나리오: 충전 요청(READY) → 결제 완료 시 잔액 반영        ║");
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
        clearInvocations(portoneClient);
        user = userRepository.save(TestFixture.createUser("테스트 유저"));
    }

    @AfterEach
    void cleanup() {
        deleteWalletChargeRedisKeys();
        tradeReportRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    private void deleteWalletChargeRedisKeys() {
        Set<String> keys = redisTemplate.keys("wallet:charge*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 가상머니 충전 · 예외")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class WalletChargeFlowTest {

        @Test
        @Order(1)
        @DisplayName("I-1. 충전 요청 시 PortOne 사전등록 하면 결제 상태가 READY 상태가 된다.")
        void createWalletCharge() {
            IT_LOG.info("    [요청] 가상머니 충전 생성 (PortOne preRegister + Redis READY)");
            // given
            doNothing().when(portoneClient).preRegisterPayment(anyString(), anyLong());
            WalletChargeCreateRequest request = new WalletChargeCreateRequest(CHARGE_AMOUNT);

            // when
            WalletChargeCreateResponse response = walletChargeService.createWalletCharge(request, user.getId());

            // then
            assertThat(response.paymentId()).isNotNull();
            assertThat(walletChargeRepository.findByPaymentId(response.paymentId()))
                    .hasValueSatisfying(walletCharge -> {
                        assertThat(walletCharge.userId()).isEqualTo(user.getId());
                        assertThat(walletCharge.amount()).isEqualTo(CHARGE_AMOUNT);
                        assertThat(walletCharge.status()).isEqualTo(PaymentStatus.READY);
                    });
            IT_LOG.info("    [검증] ✔ paymentId 발급 및 Redis WalletCharge READY 적재 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 결제 완료 시 잔액 반영·Redis 정리·거래내역(CHARGE)이 생성된다.")
        void completeWalletCharge() {
            IT_LOG.info("    [요청] 충전 결제 완료 (PortOne 조회 → 잔액 반영 → Redis 삭제 → TradeReport)");
            // given
            String paymentId = UUID.randomUUID().toString();
            WalletCharge walletCharge = TestFixture.createWalletCharge(user.getId(), PaymentStatus.READY);
            walletChargeRepository.save(paymentId, walletCharge);

            PaidPayment paidPayment = mock(PaidPayment.class);
            PaymentAmount amount = mock(PaymentAmount.class);
            when(paidPayment.getAmount()).thenReturn(amount);
            when(amount.getTotal()).thenReturn(CHARGE_AMOUNT);
            when(portoneClient.getPayment(paymentId)).thenReturn(paidPayment);

            WalletChargeCompleteRequest request = new WalletChargeCompleteRequest(paymentId);

            // when
            walletChargeService.completeWalletCharge(request, user.getId());

            // then
            assertThat(userRepository.findById(user.getId()))
                    .hasValueSatisfying(savedUser -> assertThat(savedUser.getBalance()).isEqualTo(CHARGE_AMOUNT));
            assertThat(walletChargeRepository.findByPaymentId(paymentId)).isEmpty();

            List<TradeReport> reports = tradeReportRepository.findAll();
            assertThat(reports).hasSize(1);
            assertThat(reports.getFirst().getAmount()).isEqualTo(CHARGE_AMOUNT);
            assertThat(reports.getFirst().getTradeType()).isEqualTo(CHARGE);
            IT_LOG.info("    [검증] ✔ 잔액 반영, Redis charge 키 제거, CHARGE 거래내역 1건 확인");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. 최소 충전 금액(1만원) 미만이면 생성할 수 없다.")
        void createWalletCharge_whenAmountTooLow() {
            IT_LOG.info("    [요청] 최소 금액 미만으로 충전 생성 시도");
            // given
            WalletChargeCreateRequest request = new WalletChargeCreateRequest(CHARGE_AMOUNT - 1);

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> walletChargeService.createWalletCharge(request, user.getId()));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(WalletErrorCode.WALLET_CHARGE_AMOUNT_TOO_LOW);
            IT_LOG.info("    [검증] ✔ WALLET_CHARGE_AMOUNT_TOO_LOW");
        }

        @Test
        @Order(4)
        @DisplayName("I-4. Redis에 없는 paymentId로 완료 요청 시 NOT_FOUND.")
        void completeWalletCharge_whenChargeNotFound() {
            IT_LOG.info("    [요청] 미등록 paymentId로 결제 완료 시도");
            // given
            String unknownPaymentId = UUID.randomUUID().toString();
            WalletChargeCompleteRequest request = new WalletChargeCompleteRequest(unknownPaymentId);

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> walletChargeService.completeWalletCharge(request, user.getId()));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(WalletErrorCode.WALLET_CHARGE_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ WALLET_CHARGE_NOT_FOUND");
        }

        @Test
        @Order(5)
        @DisplayName("I-5. 다른 유저 id로 완료 요청 시 UNAUTHORIZED.")
        void completeWalletCharge_whenWrongUser() {
            IT_LOG.info("    [요청] 충전 소유자가 아닌 사용자가 결제 완료 시도");
            // given
            User intruder = userRepository.save(TestFixture.createUser("타인"));
            String paymentId = UUID.randomUUID().toString();
            walletChargeRepository.save(paymentId, TestFixture.createWalletCharge(user.getId(), PaymentStatus.READY));

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> walletChargeService.completeWalletCharge(
                            new WalletChargeCompleteRequest(paymentId), intruder.getId()));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(WalletErrorCode.WALLET_CHARGE_UNAUTHORIZED);
            assertThat(walletChargeRepository.findByPaymentId(paymentId)).isPresent();
            IT_LOG.info("    [검증] ✔ WALLET_CHARGE_UNAUTHORIZED, Redis 건 유지");
        }

        @Test
        @Order(6)
        @DisplayName("I-6. PortOne 결제액과 Redis 금액이 다르면 MISMATCH 후 FAILED 처리.")
        void completeWalletCharge_whenAmountMismatch() {
            IT_LOG.info("    [요청] PG 금액 ≠ Redis 등록 금액인 PaidPayment");
            // given
            String paymentId = UUID.randomUUID().toString();
            walletChargeRepository.save(paymentId, TestFixture.createWalletCharge(user.getId(), PaymentStatus.READY));

            PaidPayment paidPayment = mock(PaidPayment.class);
            PaymentAmount amount = mock(PaymentAmount.class);
            when(paidPayment.getAmount()).thenReturn(amount);
            when(amount.getTotal()).thenReturn(CHARGE_AMOUNT - 1);
            when(portoneClient.getPayment(paymentId)).thenReturn(paidPayment);

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> walletChargeService.completeWalletCharge(
                            new WalletChargeCompleteRequest(paymentId), user.getId()));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(WalletErrorCode.WALLET_CHARGE_AMOUNT_MISMATCH);
            assertThat(userRepository.findById(user.getId())).hasValueSatisfying(u -> assertThat(u.getBalance()).isZero());
            assertThat(tradeReportRepository.findAll()).isEmpty();
            assertThat(walletChargeRepository.findByPaymentId(paymentId))
                    .hasValueSatisfying(c -> assertThat(c.status()).isEqualTo(PaymentStatus.FAILED));
            IT_LOG.info("    [검증] ✔ WALLET_CHARGE_AMOUNT_MISMATCH, 잔액·거래내역 없음, Redis FAILED");
        }

        @Test
        @Order(7)
        @DisplayName("I-7. 이미 PAID인 건에 대한 완료 요청은 조용히 무시(이중 적립 방지).")
        void completeWalletCharge_whenAlreadyPaid_idempotent() {
            IT_LOG.info("    [요청] Redis 상태가 이미 PAID인 충전에 complete 재호출");
            // given
            String paymentId = UUID.randomUUID().toString();
            walletChargeRepository.save(paymentId, TestFixture.createWalletCharge(user.getId(), PaymentStatus.PAID));

            // when
            walletChargeService.completeWalletCharge(new WalletChargeCompleteRequest(paymentId), user.getId());

            // then
            assertThat(userRepository.findById(user.getId())).hasValueSatisfying(u -> assertThat(u.getBalance()).isZero());
            assertThat(tradeReportRepository.findAll()).isEmpty();
            assertThat(walletChargeRepository.findByPaymentId(paymentId))
                    .hasValueSatisfying(c -> assertThat(c.status()).isEqualTo(PaymentStatus.PAID));
            IT_LOG.info("    [검증] ✔ 잔액·거래내역 변화 없음, PAID 유지");
        }

        @Test
        @Order(8)
        @DisplayName("I-8. PortOne이 아직 결제대기(PayPending)면 잔액 반영 없이 상태만 PENDING으로 갱신.")
        void completeWalletCharge_whenPayPending() {
            IT_LOG.info("    [요청] Paid가 아닌 PayPendingPayment 응답");
            // given
            String paymentId = UUID.randomUUID().toString();
            walletChargeRepository.save(paymentId, TestFixture.createWalletCharge(user.getId(), PaymentStatus.READY));

            PayPendingPayment pending = mock(PayPendingPayment.class);
            when(portoneClient.getPayment(paymentId)).thenReturn(pending);

            // when
            walletChargeService.completeWalletCharge(new WalletChargeCompleteRequest(paymentId), user.getId());

            // then
            assertThat(userRepository.findById(user.getId())).hasValueSatisfying(u -> assertThat(u.getBalance()).isZero());
            assertThat(tradeReportRepository.findAll()).isEmpty();
            assertThat(walletChargeRepository.findByPaymentId(paymentId))
                    .hasValueSatisfying(c -> assertThat(c.status()).isEqualTo(PaymentStatus.PENDING));
            IT_LOG.info("    [검증] ✔ Redis PENDING만 갱신, 잔액·TradeReport 없음");
        }
    }
}
