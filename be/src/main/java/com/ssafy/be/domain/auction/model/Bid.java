package com.ssafy.be.domain.auction.model;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record Bid(
        Long userId,
        String nickname,
        Long amount,
        LocalDateTime bidAt
) {
    public boolean isHigherThanOrEqualTo(Long amount) {
        return this.amount >= amount;
    }
}
