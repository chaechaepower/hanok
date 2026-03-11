package com.ssafy.be.domain.seller.dto.request;

public record SellerProfileUpdateRequest(
        String nickname,
        String profileImage,
        String intro,
        String instaUrl,
        String youtubeUrl,
        String tiktokUrl
) {}