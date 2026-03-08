package com.ssafy.be.domain.wallet.service;

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

import static com.ssafy.be.domain.wallet.entity.WithdrawStatus.PENDING;

@Slf4j
@RequiredArgsConstructor
@Service
public class WalletWithdrawService {
    private static final int MIN_CHARGE_AMOUNT = 10000;
    private final WithdrawRequestRepository withdrawRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public void requestWithdraw(WithdrawRequestCreateRequest request, Long userId) {
        // 1. amount 값 검증
        if (request.amount() < MIN_CHARGE_AMOUNT) {
            throw new GlobalException(WalletErrorCode.WALLET_CHARGE_AMOUNT_TOO_LOW);
        }

        // 2. 잔액 검증 후 가감
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        if (!user.hasSufficientBalance(request.amount())) {
            throw new GlobalException(WalletErrorCode.WALLET_INSUFFICIENT_BALANCE);
        }

        user.requestWithdraw(request.amount());

        // 3. withdraw_request 생성
        WithdrawRequest withdrawRequest = WithdrawRequest.builder()
                .amount(request.amount())
                .withdrawStatus(PENDING)
                .user(user)
                .build();

        withdrawRequestRepository.save(withdrawRequest);
    }
}
