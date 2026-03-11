package com.ssafy.be.domain.seller.dto.response;

public record SellerStatsResponse(
        Double rating,
        Double avgShipDays,
        Long followerCount
) {}