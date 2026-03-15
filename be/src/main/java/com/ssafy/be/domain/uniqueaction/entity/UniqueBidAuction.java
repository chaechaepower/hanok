package com.ssafy.be.domain.uniqueaction.entity;

import com.ssafy.be.domain.auction.entity.Auction;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class UniqueBidAuction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", unique = true)
    private Auction auction;

    @Column
    private Long minPrice;

    @Column
    private Long maxPrice;

    @Enumerated(EnumType.STRING)
    private UniqueBidStatus status;

    private String startedAt;

    @Builder
    private UniqueBidAuction(Auction auction, Long minPrice, Long maxPrice) {
        this.auction = auction;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.status = UniqueBidStatus.READY;
    }

    public void validateSetting() {
        long unit = auction.getItem().getBidUnit();
        long slots = (maxPrice - minPrice) / unit + 1;
        double spread = (double) (maxPrice - minPrice) / minPrice;

        if (spread < 0.3) throw new IllegalArgumentException("최고가-최소가 차이가 30% 미만입니다.");
        if (slots < 50)   throw new IllegalArgumentException("슬롯 수가 너무 적습니다.");

    }

    public boolean isValidBidAmount(Long amount) {
        if (amount < minPrice || amount > maxPrice) return false;
        return (amount - minPrice) % auction.getItem().getBidUnit() == 0;
    }

    public void introduce() {
        if (status != UniqueBidStatus.READY)
            throw new IllegalStateException("READY 상태가 아닙니다");
        this.status = UniqueBidStatus.INTRODUCING;
    }

    public void start(String startedAt) {
        if (status != UniqueBidStatus.INTRODUCING)
            throw new IllegalStateException("INTRODUCING 상태가 아닙니다");
        this.status = UniqueBidStatus.LIVE;
        this.startedAt = startedAt;
    }
    public void startCalculating() {
        if (status != UniqueBidStatus.LIVE) throw new IllegalStateException("LIVE 상태가 아닙니다");
        this.status = UniqueBidStatus.CALCULATING;
    }

    public void sold() {
        this.status = UniqueBidStatus.SOLD;
    }

    public void unsold() {
        this.status = UniqueBidStatus.UNSOLD;
    }

    public boolean isLive() {
        return status == UniqueBidStatus.LIVE;
    }

    public Long getAuctionId() {
        return auction.getId();
    }

    public Long getStreamId() {
        return auction.getStream().getId();
    }

    public boolean isSeller(Long userId) {
        return auction.isSeller(userId);
    }

    public int getDuration() {
        return auction.getItem().getAuctionDuration();
    }

}
