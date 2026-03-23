package com.ssafy.be.domain.escrow.scheduler;

import com.ssafy.be.domain.escrow.entity.TxStatus;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.escrow.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@RequiredArgsConstructor
@Component
public class BlockchainRetryScheduler {

    private final EscrowRepository escrowRepository;
    private final BlockchainService blockchainService;

    @Scheduled(fixedDelay = 300_000) // 5분마다
    public void retryFailedMinting() {
        var failedEscrows = escrowRepository.findByTxStatus(TxStatus.FAILED);

        if (failedEscrows.isEmpty()) return;

        log.info("[Blockchain] 민팅 실패 재시도 건수={}", failedEscrows.size());
        failedEscrows.forEach(escrow ->
                blockchainService.issueNFTReceiptAsync(escrow.getId())
        );
    }
}