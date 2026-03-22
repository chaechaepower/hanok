package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.escrow.dto.request.EscrowCancelRequest;
import com.ssafy.be.domain.escrow.dto.request.ShipmentRegisterRequest;
import com.ssafy.be.domain.escrow.dto.response.EscrowDetailResponse;
import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.escrow.scheduler.EscrowCompleteScheduler;
import com.ssafy.be.domain.escrow.scheduler.EscrowShipmentScheduler;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static com.ssafy.be.domain.escrow.entity.EscrowStatus.DEPOSITED;
import static com.ssafy.be.domain.notification.model.NotificationType.*;

@RequiredArgsConstructor
@Service
public class EscrowService {
    public static final double FEE_RATE = 0.05;
    private final EscrowRepository escrowRepository;
    private final TradeReportRepository tradeReportRepository;
    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final NotificationService notificationService;
    private final EscrowShipmentScheduler escrowShipmentScheduler;
    private final EscrowCompleteScheduler escrowCompleteScheduler;

    @Transactional
    public void startEscrow(Bid topBid, Auction auction, ShippingAddress shippingAddress) {
        User buyer = userRepository.findById(topBid.userId())
                .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));

        buyer.depositEscrowBalance(topBid.amount());

        Escrow escrow = Escrow.builder()
                .winningPrice(topBid.amount())
                .feeAmount(calculateFeeAmount(topBid))
                .escrowStatus(DEPOSITED)
                .auction(auction)
                .buyer(buyer)
                .seller(auction.getStream().getSeller())
                .shippingAddress(shippingAddress)
                .build();

        escrowRepository.save(escrow);

        // 운송장번호 등록 72시간 타임아웃 스케줄러 예약
        escrowShipmentScheduler.scheduleEscrow(escrow.getId());

        // 알림 발송
        // 구매자
        notificationService.sendNotification(
                buyer.getId(),
                ESCROW_STARTED_FOR_BUYER.name(),
                ESCROW_STARTED_FOR_BUYER.getTitle(),
                ESCROW_STARTED_FOR_BUYER.renderBody(auction.getItem().getName()),
                "/escrows/" + escrow.getId()
        );

        // 판매자
        notificationService.sendNotification(
                auction.getStream().getSeller().getUser().getId(),
                ESCROW_STARTED_FOR_SELLER.name(),
                ESCROW_STARTED_FOR_SELLER.getTitle(),
                ESCROW_STARTED_FOR_SELLER.renderBody(buyer.getNickname(), auction.getItem().getName()),
                "/escrows/" + escrow.getId()
        );
    }

    @Transactional
    public void registerShipment(ShipmentRegisterRequest request, Long escrowId, Long userId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        // 판매자인지 확인
        validateSeller(escrow, userId);

        // 운송장번호 등록 가능한 에스크로 상태인지 확인
        validateAvailableRegisterShipment(escrow);

        // 운송장번호 등록
        escrow.registerShipment(request.carrierName(), request.trackingNumber(), LocalDateTime.now());

        // 운송장번호 등록 72시간 타임아웃 스케줄러 예약 취소
        escrowShipmentScheduler.cancelScheduledEscrow(escrowId);

        // 거래확정 24시간 타임아웃 스케줄러 등록
        escrowCompleteScheduler.scheduleEscrow(escrowId);

        // 알림 발송
        // 구매자
        notificationService.sendNotification(
                escrow.getBuyer().getId(),
                ESCROW_SHIPPED_FOR_BUYER.name(),
                ESCROW_SHIPPED_FOR_BUYER.getTitle(),
                ESCROW_SHIPPED_FOR_BUYER.renderBody(escrow.getSeller().getUser().getNickname(), escrow.getAuction().getItem().getName()),
                "/escrows/" + escrow.getId()
        );

        // 판매자
        notificationService.sendNotification(
                escrow.getSeller().getUser().getId(),
                ESCROW_SHIPPED_FOR_SELLER.name(),
                ESCROW_SHIPPED_FOR_SELLER.getTitle(),
                ESCROW_SHIPPED_FOR_SELLER.renderBody(escrow.getAuction().getItem().getName()),
                "/escrows/" + escrow.getId()
        );
    }

    @Transactional
    public void manualCancelEscrow(EscrowCancelRequest request, Long escrowId, Long userId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        // 판매자인지 확인
        validateSeller(escrow, userId);

        // 취소 가능한 상태인지 확인
        validateAvailableCancelEscrow(escrow);

        // 취소
        escrow.manualCancelEscrow(request.cancelReason());
        escrow.getBuyer().cancelDepositedEscrowBalance(escrow.getWinningPrice());
        escrow.getAuction().getItem().ready();

        // 운송장번호 등록 72시간 타임아웃 스케줄러 예약 취소
        escrowShipmentScheduler.cancelScheduledEscrow(escrowId);

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

    @Transactional
    public void completeEscrow(Long escrowId, Long userId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        // 1. 구매자인지 검증
        validateBuyer(userId, escrow);

        // 2. 거래 확정 가능한 상태인지 검증
        validateAvailableCompleteEscrow(escrow);

        // 3. 에스크로 구매 확정
        escrow.completeEscrow(); // 에스크로 상태 -> 거래 완료
        escrow.getAuction().getItem().sold(LocalDateTime.now()); // 물건 상태 -> 판매 완료

        // 거래 확정 24시간 타임아웃 스케줄러 예약 취소
        escrowCompleteScheduler.cancelScheduledEscrow(escrowId);

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
                ESCROW_COMPLETED.name(),
                ESCROW_COMPLETED.getTitle(),
                ESCROW_COMPLETED.renderBody(escrow.getAuction().getItem().getName()),
                "/escrows/" + escrow.getId()
        );

        // 판매자
        notificationService.sendNotification(
                escrow.getSeller().getUser().getId(),
                ESCROW_COMPLETED.name(),
                ESCROW_COMPLETED.getTitle(),
                ESCROW_COMPLETED.renderBody(escrow.getAuction().getItem().getName()),
                "/escrows/" + escrow.getId()
        );
    }

    @Transactional(readOnly = true)
    public List<EscrowListResponse> getAllSellerEscrows(Long userId) {
        // seller로 등록되있는지 여부확인
        if (!sellerRepository.existsByUserId(userId)) {
            throw new GlobalException(SellerErrorCode.SELLER_NOT_FOUND);
        }

        return escrowRepository.findAllBySellerUserId(userId).stream()
                .map(escrow -> {
                    Item item = escrow.getAuction().getItem();

                    return EscrowListResponse.builder()
                            .escrowId(escrow.getId())
                            .image(item.getImage1())
                            .itemName(item.getName())
                            .amount(escrow.getWinningPrice())
                            .escrowStatus(escrow.getEscrowStatus())
                            .createdAt(escrow.getCreatedAt())
                            .build();
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<EscrowListResponse> getAllBuyerEscrows(Long userId) {
        return escrowRepository.findAllByBuyerUserId(userId).stream()
                .map(escrow -> {
                    Item item = escrow.getAuction().getItem();

                    return EscrowListResponse.builder()
                            .escrowId(escrow.getId())
                            .image(item.getImage1())
                            .itemName(item.getName())
                            .amount(escrow.getWinningPrice())
                            .escrowStatus(escrow.getEscrowStatus())
                            .createdAt(escrow.getCreatedAt())
                            .build();
                }).toList();
    }

    @Transactional(readOnly = true)
    public EscrowDetailResponse getEscrowDetail(Long escrowId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        return buildEscrowDetailResponse(
                buildWinningInfo(escrow),
                buildShippingAddress(escrow.getShippingAddress()),
                buildDelivery(escrow)
        );
    }

    private static long calculateFeeAmount(Bid topBid) {
        return (long) (topBid.amount() * FEE_RATE);
    }

    private void validateSeller(Escrow escrow, Long userId) {
        if (!escrow.isSeller(userId)) {
            throw new GlobalException(EscorwErrorCode.ESCROW_NOT_SELLER);
        }
    }

    private static void validateBuyer(Long userId, Escrow escrow) {
        if (!escrow.isBuyer(userId)) {
            throw new GlobalException(EscorwErrorCode.ESCROW_NOT_BUYER);
        }
    }

    private void validateAvailableRegisterShipment(Escrow escrow) {
        if (!escrow.isAvailableRegisterShipment()) {
            throw new GlobalException(EscorwErrorCode.ESCROW_INVALID_STATUS);
        }
    }

    private void validateAvailableCancelEscrow(Escrow escrow) {
        if (!escrow.isAvailableManualCancelEscrow()) {
            throw new GlobalException(EscorwErrorCode.ESCROW_INVALID_STATUS);
        }
    }

    private void validateAvailableCompleteEscrow(Escrow escrow) {
        if (!escrow.isAvailableCompleteEscrow()) {
            throw new GlobalException(EscorwErrorCode.ESCROW_INVALID_STATUS);
        }
    }

    private EscrowDetailResponse.WinningDto buildWinningInfo(Escrow escrow) {
        return EscrowDetailResponse.WinningDto.builder()
                .image(escrow.getAuction().getItem().getImage1())
                .itemName(escrow.getAuction().getItem().getName())
                .finalPrice(escrow.getWinningPrice())
                .sellerName(escrow.getSeller().getUser().getNickname())
                .sellerId(escrow.getSeller().getId())
                .wonAt(escrow.getCreatedAt())
                .build();
    }

    private EscrowDetailResponse.ShippingAddressDto buildShippingAddress(ShippingAddress shippingAddress) {
        return EscrowDetailResponse.ShippingAddressDto.builder()
                .name(shippingAddress.getRecipientName())
                .phone(shippingAddress.getPhone())
                .postalCode(shippingAddress.getPostalCode())
                .address(shippingAddress.getAddress())
                .addressDetail(shippingAddress.getAddressDetail())
                .build();
    }

    private EscrowDetailResponse.DeliveryDto buildDelivery(Escrow escrow) {
        return EscrowDetailResponse.DeliveryDto.builder()
                .carrierName(escrow.getCarrierName())
                .trackingNumber(escrow.getTrackingNumber())
                .build();
    }

    private static EscrowDetailResponse buildEscrowDetailResponse(EscrowDetailResponse.WinningDto winningInfo, EscrowDetailResponse.ShippingAddressDto shippingAddress, EscrowDetailResponse.DeliveryDto delivery) {
        return EscrowDetailResponse.builder()
                .winningInfo(winningInfo)
                .shippingAddress(shippingAddress)
                .delivery(delivery)
                .build();
    }
}

