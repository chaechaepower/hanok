package com.ssafy.be.domain.escrow.entity;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Objects;

import static com.ssafy.be.domain.escrow.entity.EscrowStatus.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Entity
public class Escrow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long winningPrice;

    private Long feeAmount;

    @Enumerated(EnumType.STRING)
    private EscrowStatus escrowStatus;

    private String carrierName;

    private String trackingNumber;

    private LocalDateTime submittedAt;

    private String cancelReason;

    private String txHash;

    @Enumerated(EnumType.STRING)
    private TxStatus txStatus;

    private LocalDateTime mintedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id")
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_address_id")
    private ShippingAddress shippingAddress;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime modifiedAt;

    @Builder
    private Escrow(Long winningPrice,
                   Long feeAmount,
                   EscrowStatus escrowStatus,
                   String carrierName,
                   String trackingNumber,
                   LocalDateTime submittedAt,
                   Auction auction,
                   User buyer,
                   Seller seller,
                   ShippingAddress shippingAddress,
                   LocalDateTime createdAt,
                   LocalDateTime modifiedAt,
                   String txHash,
                   TxStatus txStatus,
                   LocalDateTime mintedAt
                   ) {
        this.winningPrice = winningPrice;
        this.feeAmount = feeAmount;
        this.escrowStatus = escrowStatus;
        this.carrierName = carrierName;
        this.trackingNumber = trackingNumber;
        this.submittedAt = submittedAt;
        this.auction = auction;
        this.buyer = buyer;
        this.seller = seller;
        this.shippingAddress = shippingAddress;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
        this.txHash = txHash;
        this.txStatus = txStatus;
        this.mintedAt = mintedAt;
    }

    public void registerShipment(String carrierName, String trackingNumber, LocalDateTime submittedAt) {
        if (!isAvailableRegisterShipment()) {
            throw new IllegalArgumentException("운송장 번호를 등록할 수 있는 에스크로 상태가 아닙니다.");
        }

        this.escrowStatus = SHIPPED;
        this.carrierName = carrierName;
        this.trackingNumber = trackingNumber;
        this.submittedAt = submittedAt;
    }

    public void completeEscrow() {
        this.escrowStatus = COMPLETED;
    }

    public void completeMinting(String txHash) {
        this.txHash = txHash;
        this.txStatus = TxStatus.COMPLETED;
        this.mintedAt = LocalDateTime.now();
    }

    public void failMinting() {
        this.txStatus = TxStatus.FAILED;
    }

    public void pendingMinting() {
        this.txStatus = TxStatus.PENDING;
    }

    public void manualCancelEscrow(String cancelReason) {
        if (!isAvailableManualCancelEscrow()) {
            throw new IllegalArgumentException("취소할 수 있는 에스크로 상태가 아닙니다.");
        }

        this.escrowStatus = CANCELLED;
        this.cancelReason = cancelReason;
    }

    public void autoCancelEscrow() {
        if (!isDeposited()) {
            throw new IllegalArgumentException("취소할 수 있는 에스크로 상태가 아닙니다.");
        }

        this.escrowStatus = CANCELLED;
        this.cancelReason = "판매자가 운송장번호를 72시간 내에 등록하지 않아 자동 취소됐습니다.";
    }

    public boolean isSeller(Long userId) {
        return Objects.equals(this.seller.getUser().getId(), userId);
    }

    public boolean isBuyer(Long userId) {
        return Objects.equals(this.buyer.getId(), userId);
    }

    public boolean isAvailableRegisterShipment() {
        return this.escrowStatus == DEPOSITED;
    }

    public boolean isAvailableManualCancelEscrow() {
        return this.escrowStatus == DEPOSITED;
    }

    public boolean isAvailableCompleteEscrow() {
        return this.escrowStatus == SHIPPED;
    }

    public boolean isDeposited() {
        return this.escrowStatus == DEPOSITED;
    }
}
