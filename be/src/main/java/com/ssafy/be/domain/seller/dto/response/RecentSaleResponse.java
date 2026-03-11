package com.ssafy.be.domain.seller.dto.response;

import java.time.LocalDateTime;

public record RecentSaleResponse(
        Long itemId,
        String title,
        Long finalPrice,
        LocalDateTime soldAt
) {}