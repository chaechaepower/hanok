package com.ssafy.be.domain.wallet.service;

import com.ssafy.be.domain.wallet.dto.request.WithdrawRequestCreateRequest;
import com.ssafy.be.domain.wallet.exception.WalletErrorCode;
import com.ssafy.be.global.exception.GlobalErrorCode;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OptimisticLockWithdrawRequestFacade {

    private static final int MAX_RETRY = 64;

    private final WalletWithdrawService walletWithdrawService;

    public void processWithdrawRequest(WithdrawRequestCreateRequest request, Long memberId) {
        int retry = 0;

        while (retry < MAX_RETRY) {
            try {
                walletWithdrawService.requestWithdrawOptimistic(request, memberId);
                return;
            } catch (OptimisticLockingFailureException e) {
                retry++;

                if (retry >= MAX_RETRY) {
                    log.error("낙관적 락 재시도 한도 초과 memberId={}", memberId, e);
                    throw new GlobalException(WalletErrorCode.WALLET_WITHDRAW_CONCURRENT_CONFLICT);
                }

                log.warn("낙관적 락 충돌 재시도 retry={}/{}", retry, MAX_RETRY);
            }

            try {
                Thread.sleep(50); // 약간 대기 후 재시도
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("출금 처리 중 인터럽트 발생 memberId={}", memberId, e);
                throw new GlobalException(GlobalErrorCode.INTERNAL_SERVER_ERROR);
            }
        }
    }
}
