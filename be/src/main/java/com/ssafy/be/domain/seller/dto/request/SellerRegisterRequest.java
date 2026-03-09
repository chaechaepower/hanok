package com.ssafy.be.domain.seller.dto.request;

import com.ssafy.be.domain.seller.entity.SellerType;
import jakarta.validation.constraints.NotNull;

public record SellerRegisterRequest(
        @NotNull SellerType type,
        String businessNumber,
        String intro,
        String instaUrl,
        String youtubeUrl,
        String tiktokUrl
) {}