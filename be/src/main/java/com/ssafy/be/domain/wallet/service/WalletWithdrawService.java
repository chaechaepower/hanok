package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.request.WithdrawRequestCreateRequest;
import com.ssafy.be.domain.wallet.entity.WithdrawRequest;
import com.ssafy.be.domain.wallet.exception.WalletErrorCode;
import com.ssafy.be.domain.wallet.repository.WithdrawRequestRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.ssafy.be.domain.tradereport.entity.TradeType.WITHDRAW;
import static com.ssafy.be.domain.wallet.entity.WithdrawStatus.PENDING;

@Slf4j
@RequiredArgsConstructor
@Service
public class WalletWithdrawService {
    private static final int MIN_WITHDRAW_AMOUNT = 10000;
    private final WithdrawRequestRepository withdrawRequestRepository;
    private final TradeReportRepository tradeReportRepository;
    private final UserRepository userRepository;

    @Transactional
    public void requestWithdrawWithoutLock(WithdrawRequestCreateRequest request, Long userId) {
        // 1. amount 값 검증
        if (request.amount() < MIN_WITHDRAW_AMOUNT) {
            throw new GlobalException(WalletErrorCode.WALLET_WITHDRAW_AMOUNT_TOO_LOW);
        }

        // 2. 잔액 검증 후 가감
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        if (!user.hasSufficientBalance(request.amount())) {
            throw new GlobalException(WalletErrorCode.WALLET_INSUFFICIENT_BALANCE);
        }

        user.requestWithdraw(request.amount());

        // 3. withdrawRequest 생성
        WithdrawRequest withdrawRequest = WithdrawRequest.builder()
                .amount(request.amount())
                .withdrawStatus(PENDING)
                .user(user)
                .build();

        withdrawRequestRepository.save(withdrawRequest);
    }

    @Transactional
    public void requestWithdrawPessimistic(WithdrawRequestCreateRequest request, Long userId) {
        // 1. amount 값 검증
        if (request.amount() < MIN_WITHDRAW_AMOUNT) {
            throw new GlobalException(WalletErrorCode.WALLET_WITHDRAW_AMOUNT_TOO_LOW);
        }

        // 2. 잔액 검증 후 가감
        User user = userRepository.findByIdWithPessimisticLock(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        if (!user.hasSufficientBalance(request.amount())) {
            throw new GlobalException(WalletErrorCode.WALLET_INSUFFICIENT_BALANCE);
        }

        user.requestWithdraw(request.amount());

        // 3. withdrawRequest 생성
        WithdrawRequest withdrawRequest = WithdrawRequest.builder()
                .amount(request.amount())
                .withdrawStatus(PENDING)
                .user(user)
                .build();

        withdrawRequestRepository.save(withdrawRequest);
    }

    @Transactional
    public void requestWithdrawOptimistic(WithdrawRequestCreateRequest request, Long userId) {
        // 1. amount 값 검증
        if (request.amount() < MIN_WITHDRAW_AMOUNT) {
            throw new GlobalException(WalletErrorCode.WALLET_WITHDRAW_AMOUNT_TOO_LOW);
        }

        // 2. 잔액 검증 후 가감
        User user = userRepository.findByIdWithOptimisticLock(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        if (!user.hasSufficientBalance(request.amount())) {
            throw new GlobalException(WalletErrorCode.WALLET_INSUFFICIENT_BALANCE);
        }

        user.requestWithdraw(request.amount());

        userRepository.saveAndFlush(user);

        // 3. withdrawRequest 생성
        WithdrawRequest withdrawRequest = WithdrawRequest.builder()
                .amount(request.amount())
                .withdrawStatus(PENDING)
                .user(user)
                .build();

        withdrawRequestRepository.save(withdrawRequest);
    }

    @Transactional
    public void completeWithdraw(Long withdrawId) {
        // 1. withdrawRequest 조회 및 상태 변경
        WithdrawRequest withdrawRequest = withdrawRequestRepository.findById(withdrawId)
                .orElseThrow(() -> new GlobalException(WalletErrorCode.WALLET_WITHDRAW_REQUEST_NOT_FOUND));

        if (!withdrawRequest.isPending()) {
            throw new GlobalException(WalletErrorCode.WALLET_WITHDRAW_ALREADY_PROCESSED);
        }

        withdrawRequest.completeWithDraw();

        // 2. user의 예치된 출금 잔액 감소
        User user = withdrawRequest.getUser();
        user.decreaseDepositedWithdrawBalance(withdrawRequest.getAmount());

        // 3. tradeReport 생성 후 저장
        TradeReport tradeReport = TradeReport.builder()
                .amount(withdrawRequest.getAmount())
                .tradeType(WITHDRAW)
                .user(user)
                .build();

        tradeReportRepository.save(tradeReport);
    }
}
