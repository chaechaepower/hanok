package com.ssafy.be.domain.auction.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UniqueBidAuctionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Auction과 1:1 관계. Auction 레코드 하나당 detail 하나만 존재해야 하므로 unique = true
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", unique = true)
    private Auction auction;

    private Long minPrice;

    private Long maxPrice;

    @Builder
    public UniqueBidAuctionDetail(Auction auction, Long minPrice, Long maxPrice) {
        this.auction = auction;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
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

