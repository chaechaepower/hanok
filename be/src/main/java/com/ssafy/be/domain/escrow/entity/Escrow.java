package com.ssafy.be.domain.escrow.entity;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.seller.entity.Seller;
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
    @JoinColumn(name = "item_id")
    private Item item;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime modifiedAt;

    @Builder
    private Escrow(Long winningPrice,
                   Long feeAmount,
                  EscrowStatus escrowStatus,
                  Auction auction,
                  User buyer,
                  Seller seller,
                  Item item,
                  LocalDateTime createdAt,
                  LocalDateTime modifiedAt) {
        this.winningPrice = winningPrice;
        this.feeAmount = feeAmount;
        this.escrowStatus = escrowStatus;
        this.auction = auction;
        this.buyer = buyer;
        this.seller = seller;
        this.item = item;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }
}
