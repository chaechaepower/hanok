package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.exception.WalletErrorCode;
import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCompleteRequest;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCreateRequest;
import com.ssafy.be.domain.wallet.dto.response.WalletChargeCreateResponse;
import com.ssafy.be.domain.wallet.model.WalletCharge;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.domain.wallet.repository.WalletChargeRepository;
import io.portone.sdk.server.payment.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static com.ssafy.be.domain.tradereport.entity.TradeType.CHARGE;
import static com.ssafy.be.domain.wallet.model.PaymentStatus.*;

@Slf4j
@RequiredArgsConstructor
@Service
public class WalletChargeService {
    private static final int MIN_CHARGE_AMOUNT = 10000;
    private final WalletChargeRepository walletChargeRepository;
    private final TradeReportRepository tradeReportRepository;
    private final UserRepository userRepository;
    private final PortoneClient portoneClient;

    public WalletChargeCreateResponse createWalletCharge(WalletChargeCreateRequest request, Long userId) {
        // 1. amount 값 검증
        if (request.amount() < MIN_CHARGE_AMOUNT) {
            throw new GlobalException(WalletErrorCode.WALLET_CHARGE_AMOUNT_TOO_LOW);
        }

        // 2. portone에 사전 등록
        String paymentId = UUID.randomUUID().toString();
        portoneClient.preRegisterPayment(paymentId, request.amount());

        // 3. redis에 결제 정보 저장
        WalletCharge walletCharge = WalletCharge.builder()
                .userId(userId)
                .amount(request.amount())
                .status(READY)
                .build();

        walletChargeRepository.save(paymentId, walletCharge);

        // 4. 응답
        return WalletChargeCreateResponse.builder()
                .paymentId(paymentId)
                .build();
    }

    @Transactional
    public void completeWalletCharge(WalletChargeCompleteRequest request, Long userId) {
        WalletCharge walletCharge = walletChargeRepository.findByPaymentId(request.paymentId())
                .orElseThrow(() -> new GlobalException(WalletErrorCode.WALLET_CHARGE_NOT_FOUND));

        if (!walletCharge.userId().equals(userId)) {
            throw new GlobalException(WalletErrorCode.WALLET_CHARGE_UNAUTHORIZED);
        }

        syncPayment(walletCharge, request.paymentId());
    }

    @Transactional
    public void handleWebhook(String body, String webhookId, String webhookTimestamp, String webhookSignature) {
        String paymentId = portoneClient.handleWebhook(body, webhookId, webhookTimestamp, webhookSignature);

        WalletCharge walletCharge = walletChargeRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new GlobalException(WalletErrorCode.WALLET_CHARGE_NOT_FOUND));

        syncPayment(walletCharge, paymentId);
    }

    private void syncPayment(WalletCharge walletCharge, String paymentId) {
        // 이미 결제 완료됨(웹훅 요청 시점)
        if (walletCharge.status() == PAID) {
            return;
        }

        // portone으로부터 결제 정보 가져옴
        Payment payment = portoneClient.getPayment(paymentId);
        PaymentStatus status = resolveStatus(payment);

        if (status == null) {
            log.warn("처리하지 않는 결제 상태: {}", payment.getClass().getSimpleName());
            return;
        }

        if (status == PAID) {
            processChargePayment(walletCharge, paymentId, (PaidPayment) payment);
            return;
        }

        walletChargeRepository.updatePaymentStatus(paymentId, status);
    }

    private PaymentStatus resolveStatus(Payment payment) {
        return switch (payment) {
            case PaidPayment ignored -> PAID;
            case PayPendingPayment ignored -> PENDING;
            case VirtualAccountIssuedPayment ignored -> VIRTUAL_ACCOUNT_ISSUED;
            case CancelledPayment ignored -> CANCELLED;
            case FailedPayment ignored -> FAILED;
            default -> null;
        };
    }

    private void processChargePayment(WalletCharge walletCharge, String paymentId, PaidPayment paidPayment) {
        // 1. redis에 등록된 결제 정보랑 검증하여 유효한 결제인지 확인
        validatePayment(paidPayment, paymentId, walletCharge);

        log.info("가상머니 충전 성공 {}", paidPayment.getId());

        // 2. 결제 상태 변경
        walletChargeRepository.updatePaymentStatus(paymentId, PAID);

        // 3. 잔액 증가
        User user = userRepository.findById(walletCharge.userId())
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        user.increaseBalance(walletCharge.amount());

        // 4. 거래 내역 생성
        TradeReport tradeReport = TradeReport.builder()
                .amount(walletCharge.amount())
                .tradeType(CHARGE)
                .user(user)
                .build();

        tradeReportRepository.save(tradeReport);

        // 5. 레디스에서 해당 가상머니 충전 건 삭제
        walletChargeRepository.deleteByPaymentId(paymentId);
    }

    private void validatePayment(PaidPayment paidPayment, String paymentId, WalletCharge walletCharge) {
        if (paidPayment.getAmount().getTotal() != walletCharge.amount()) {
            walletChargeRepository.updatePaymentStatus(paymentId, FAILED);
            throw new GlobalException(WalletErrorCode.WALLET_CHARGE_AMOUNT_MISMATCH);
        }
    }
}
