package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCompleteRequest;
import com.ssafy.be.domain.wallet.model.WalletCharge;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCreateRequest;
import com.ssafy.be.domain.wallet.dto.response.WalletChargeCreateResponse;
import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.repository.WalletChargeRepository;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.support.util.TestFixture;
import io.portone.sdk.server.payment.PaidPayment;
import io.portone.sdk.server.payment.PaymentAmount;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.UUID;

import static com.ssafy.be.domain.tradereport.entity.TradeType.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;

@IntegrationTest
class WalletChargeServiceTest {
    @Autowired
    private WalletChargeService walletChargeService;

    @Autowired
    private WalletChargeRepository walletChargeRepository;

    @Autowired
    private TradeReportRepository tradeReportRepository;

    @MockitoBean
    private PortoneClient portoneClient;

    @Autowired
    private UserRepository userRepository;


    @AfterEach
    void cleanup() {
        tradeReportRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @DisplayName("가상머니를 충전한다.")
    @Test
    void createWalletCharge() {
        // given
        User user = userRepository.save(
                TestFixture.createUser("테스트 유저")
        );

        doNothing().when(portoneClient).preRegisterPayment(anyString(), anyLong());

        WalletChargeCreateRequest request = new WalletChargeCreateRequest(10000L);

        // when
        WalletChargeCreateResponse response = walletChargeService.createWalletCharge(request, user.getId());

        // then
        assertThat(response.paymentId()).isNotNull();

        assertThat(walletChargeRepository.findByPaymentId(response.paymentId()))
                .hasValueSatisfying(walletCharge -> {
                    assertThat(walletCharge.userId()).isEqualTo(user.getId());
                    assertThat(walletCharge.amount()).isEqualTo(10000L);
                    assertThat(walletCharge.status()).isEqualTo(PaymentStatus.READY);
                });
    }

    @DisplayName("가상머니 충전 결제를 완료한다.")
    @Test
    void completeWalletCharge() {
        // given
        // 유저 생성
        User user = userRepository.save(
                TestFixture.createUser("테스트 유저")
        );

        // 가상머니(결제 준비 상태) 생성
        String paymentId = UUID.randomUUID().toString();

        WalletCharge walletCharge = TestFixture.createWalletCharge(
                user.getId(),
                PaymentStatus.READY
        );

        walletChargeRepository.save(paymentId, walletCharge);

        // PortoneClient로부터 조회한 Payment 정보 stubbing
        PaidPayment paidPayment = Mockito.mock(PaidPayment.class);
        PaymentAmount amount = Mockito.mock(PaymentAmount.class);

        Mockito.when(paidPayment.getAmount()).thenReturn(amount);
        Mockito.when(amount.getTotal()).thenReturn(10000L);
        Mockito.when(portoneClient.getPayment(paymentId)).thenReturn(paidPayment);

        // 요청 dto 생성
        WalletChargeCompleteRequest request = new WalletChargeCompleteRequest(paymentId);

        // when
        walletChargeService.completeWalletCharge(request, user.getId());

        // then
        // 유저 잔액 증가 검증
        assertThat(userRepository.findById(user.getId()))
                .hasValueSatisfying(savedUser ->
                        assertThat(savedUser.getBalance()).isEqualTo(10000L)
                );

        // Redis에서 walletCharge 삭제 검증
        assertThat(walletChargeRepository.findByPaymentId(paymentId)).isEmpty();

        // 거래 내역 생성 검증
        List<TradeReport> reports = tradeReportRepository.findAll();
        assertThat(reports).hasSize(1);
        assertThat(reports.get(0).getAmount()).isEqualTo(10000L);
        assertThat(reports.get(0).getTradeType()).isEqualTo(CHARGE);
    }
}