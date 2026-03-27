package com.ssafy.be.domain.seller.dto.request;

import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.user.entity.BankCode;
import jakarta.validation.constraints.NotNull;

public record SellerRegisterRequest(
        @NotNull SellerType type,
        String businessNumber,
        String shopName,
        String intro,
        String instaUrl,
        String youtubeUrl,
        String tiktokUrl,
        BankCode bankCode,
        String accountNum,
        String accountName
) {}