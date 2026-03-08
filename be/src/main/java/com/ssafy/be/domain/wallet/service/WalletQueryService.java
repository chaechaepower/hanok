package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.domain.wallet.dto.response.WalletSummaryResponse;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@RequiredArgsConstructor
@Service
public class WalletQueryService {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public WalletSummaryResponse getWalletSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        return WalletSummaryResponse.builder()
                .balance(user.getBalance())
                .depositedAuctionBalance(user.getDepositedBalance())
                .build();
    }
}
