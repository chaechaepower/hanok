package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static com.ssafy.be.domain.notification.model.NotificationType.*;

@RequiredArgsConstructor
@Service
public class EscrowCompleteService {
    private final EscrowRepository escrowRepository;
    private final TradeReportRepository tradeReportRepository;
    private final NotificationService notificationService;

    @Transactional
    public void autoCompleteEscrow(Long escrowId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        // DEPOSITED 상태인지
        validateEscrowStatusShipped(escrow);

        // 3. 에스크로 구매 확정
        escrow.completeEscrow(); // 에스크로 상태 -> 거래 완료
        escrow.getAuction().getItem().sold(LocalDateTime.now()); // 물건 상태 -> 판매 완료

        // 4. 구매자 에스크로 예치 금액 감소
        User buyer = escrow.getBuyer();
        buyer.decreaseDepositedEscrowBalance(escrow.getWinningPrice());

        // 5. 판매자 정산
        User seller = escrow.getSeller().getUser();
        long settlementAmount = escrow.getWinningPrice() - escrow.getFeeAmount();
        seller.increaseBalance(settlementAmount);

        // 6. 거래 내역 생성
        TradeReport sellerTradeReport = TradeReport.builder()
                .amount(settlementAmount)
                .tradeType(TradeType.SETTLEMENT)
                .user(seller)
                .escrow(escrow)
                .build();

        TradeReport buyerTradeReport = TradeReport.builder()
                .amount(-escrow.getWinningPrice())
                .tradeType(TradeType.SETTLEMENT)
                .user(buyer)
                .escrow(escrow)
                .build();

        tradeReportRepository.saveAll(List.of(sellerTradeReport, buyerTradeReport));

        // 알림 발송
        // 구매자
        notificationService.sendNotification(
                escrow.getBuyer().getId(),
                ESCROW_AUTO_COMPLETED.name(),
                ESCROW_AUTO_COMPLETED.getTitle(),
                ESCROW_AUTO_COMPLETED.renderBody(escrow.getAuction().getItem().getName()),
                null
        );

        // 판매자
        notificationService.sendNotification(
                escrow.getSeller().getUser().getId(),
                ESCROW_AUTO_COMPLETED.name(),
                ESCROW_AUTO_COMPLETED.getTitle(),
                ESCROW_AUTO_COMPLETED.renderBody(escrow.getAuction().getItem().getName()),
                null
        );
    }

    private void validateEscrowStatusShipped(Escrow escrow) {
        if (!escrow.isAvailableCompleteEscrow()) {
            throw new GlobalException(EscorwErrorCode.ESCROW_INVALID_STATUS);
        }
    }
}
