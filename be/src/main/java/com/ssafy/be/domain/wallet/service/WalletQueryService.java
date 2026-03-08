package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.response.WalletSummaryResponse;
import com.ssafy.be.domain.wallet.dto.response.WithdrawRequestResponse;
import com.ssafy.be.domain.wallet.entity.WithdrawRequest;
import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import com.ssafy.be.domain.wallet.repository.WithdrawRequestRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class WalletQueryService {
    private final UserRepository userRepository;
    private final WithdrawRequestRepository withdrawRequestRepository;

    @Transactional(readOnly = true)
    public WalletSummaryResponse getWalletSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        return WalletSummaryResponse.builder()
                .balance(user.getBalance())
                .depositedAuctionBalance(user.getDepositedAuctionBalance())
                .build();
    }

    @Transactional(readOnly = true)
    public List<WithdrawRequestResponse> getAllWithdrawRequests(WithdrawStatus status) {
        List<WithdrawRequest> withdrawRequests = (status == null)
                ? withdrawRequestRepository.findAll()
                : withdrawRequestRepository.findByWithdrawStatus(status);

        return withdrawRequests.stream()
                .map(withdraw -> {
                    User user = withdraw.getUser();

                    return WithdrawRequestResponse.builder()
                            .id(withdraw.getId())
                            .userId(user.getId())
                            .accountName(user.getAccountName())
                            .bankCode(user.getBankCode())
                            .accountNum(user.getAccountNum())
                            .amount(withdraw.getAmount())
                            .status(withdraw.getWithdrawStatus())
                            .requestedAt(withdraw.getRequestedAt())
                            .processedAt(withdraw.getProcessedAt())
                            .build();
                })
                .toList();
    }
}
