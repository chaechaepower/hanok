package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.ssafy.be.domain.notification.model.NotificationType.ESCROW_CANCELLED;

@RequiredArgsConstructor
@Service
public class EscrowCancellationService {
    private final EscrowRepository escrowRepository;
    private final NotificationService notificationService;

    @Transactional
    public void autoCancelEscrow(Long escrowId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        // DEPOSITED 상태인지
        validateEscrowStatusDeposited(escrow);

        escrow.autoCancelEscrow();
        escrow.getBuyer().cancelDepositedEscrowBalance(escrow.getWinningPrice());

        // 판매자 평점 감소
        escrow.getSeller().increasePenaltyCount();

        // 알림 발송
        // 구매자
        notificationService.sendNotification(
                escrow.getBuyer().getId(),
                ESCROW_CANCELLED.name(),
                ESCROW_CANCELLED.getTitle(),
                ESCROW_CANCELLED.renderBody(escrow.getAuction().getItem().getName()),
                "/escrows/" + escrow.getId()
        );

        // 판매자
        notificationService.sendNotification(
                escrow.getSeller().getUser().getId(),
                ESCROW_CANCELLED.name(),
                ESCROW_CANCELLED.getTitle(),
                ESCROW_CANCELLED.renderBody(escrow.getAuction().getItem().getName()),
                "/escrows/" + escrow.getId()
        );
    }

    private void validateEscrowStatusDeposited(Escrow escrow) {
        if (!escrow.isDeposited()) {
            throw new GlobalException(EscorwErrorCode.ESCROW_INVALID_STATUS);
        }
    }
}
