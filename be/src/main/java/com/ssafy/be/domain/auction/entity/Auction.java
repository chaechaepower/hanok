package com.ssafy.be.domain.auction.entity;

import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.stream.entity.Stream;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class Auction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long finalPrice;

    @Enumerated(EnumType.STRING)
    private AuctionStatus auctionStatus;

    private String startedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id")
    private Stream stream;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

//    // --- 양방향 매핑 추가 (삭제 시 자식 Detail도 함께 삭제되도록 설정) ---
//    @OneToOne(mappedBy = "auction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
//    private UniqueBidAuctionDetail uniqueBidAuctionDetail;

    @Builder
    private Auction(AuctionStatus auctionStatus,
                    Long finalPrice,
                    String startedAt,
                    Stream stream,
                    Item item) {
        this.auctionStatus = auctionStatus;
        this.finalPrice = finalPrice;
        this.startedAt = startedAt;
        this.stream = stream;
        this.item = item;
    }

//    // --- 연관관계 편의 메서드 추가 ---
//    public void assignUniqueBidDetail(UniqueBidAuctionDetail detail) {
//        this.uniqueBidAuctionDetail = detail;
//    }

    public void startAuction(String startedAt) {
        if (auctionStatus != INTRODUCING) {
            throw new IllegalArgumentException("상품 설명 단계가 아닙니다.");
        }

        this.auctionStatus = LIVE;
        this.startedAt = startedAt;
    }

    public void startCalculating() {
        if (this.auctionStatus != LIVE) {
            throw new IllegalStateException("LIVE 상태가 아닙니다.");
        }
        this.auctionStatus = CALCULATING;
    }

    public void introduceAuction() {
        if (auctionStatus != READY) {
            throw new IllegalArgumentException("경매 물품이 아닙니다.");
        }

        this.auctionStatus = INTRODUCING;
    }

    public void sold(Long finalPrice) {
        this.auctionStatus = SOLD;
        this.finalPrice = finalPrice;
    }

    public void unsold() {
        this.auctionStatus = UNSOLD;
    }

    public boolean isLive() {
        return this.auctionStatus == LIVE;
    }

    public boolean isReady() {
        return this.auctionStatus == READY;
    }

    public boolean isIntroducing() {
        return this.auctionStatus == INTRODUCING;
    }

    public boolean isCalculating() {
        return this.auctionStatus == CALCULATING;
    }

    public boolean isSeller(Long userId) {
        Long sellerId = stream.getSeller().getUser().getId();
        return Objects.equals(sellerId, userId);
    }

    public boolean isBelowStartPrice(Long amount) {
        return this.item.getStartPrice() > amount;
    }
}