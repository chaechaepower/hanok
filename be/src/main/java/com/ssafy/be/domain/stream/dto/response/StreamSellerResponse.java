package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.seller.entity.Seller;

public record StreamSellerResponse(Long sellerId, String nickname, String profileImageUri) {
}
