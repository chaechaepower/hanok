package com.ssafy.be.domain.seller.dto.response;

import com.ssafy.be.domain.seller.entity.SellerGrade;

public record SellerRegisterResponse(
        Long sellerId,
        String nickname,
        SellerGrade grade
) {}