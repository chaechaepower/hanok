package com.ssafy.be.domain.seller.dto.request;

public record SellerProfileUpdateRequest(
        String shopName,
        String profileImage,
        String intro,
        String instaUrl,
        String youtubeUrl,
        String tiktokUrl
) {}