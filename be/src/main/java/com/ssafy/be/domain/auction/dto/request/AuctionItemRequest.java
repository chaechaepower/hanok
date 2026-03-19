package com.ssafy.be.domain.auction.dto.request;

import jakarta.validation.constraints.NotNull;

public record AuctionItemRequest(
        @NotNull(message = "상품 ID는 필수입니다.")
        Long itemId,

        Long minPrice,
        Long maxPrice
) {}
