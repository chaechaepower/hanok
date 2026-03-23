package com.ssafy.be.domain.escrow.event;

import com.ssafy.be.domain.escrow.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@RequiredArgsConstructor
@Component
public class EscrowEventListener {

    private final BlockchainService blockchainService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEscrowCompleted(EscrowCompletedEvent event) {
        log.info("[Blockchain] 구매 확정 이벤트 수신 escrowId={}", event.escrowId());
        blockchainService.issueNFTReceiptAsync(event.escrowId());
    }
}